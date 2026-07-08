import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";

import { getLmsBaseUrl } from "@/lib/env";

const createClient = () => {
  const jar = new CookieJar();

  return wrapper(
    axios.create({
      jar,
      withCredentials: true,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }),
  );
};

const loginToLms = async (username, password) => {
  const client = createClient();
  const loginUrl = `${getLmsBaseUrl()}/login/index.php`;

  const loginPage = await client.get(loginUrl);
  const $ = cheerio.load(loginPage.data);
  const loginToken = $("input[name='logintoken']").val();

  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  if (loginToken) {
    formData.append("logintoken", String(loginToken));
  }

  const response = await client.post(loginUrl, formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: loginUrl,
    },
  });

  const title = cheerio.load(response.data)("title").text().toLowerCase();

  if (title.includes("log in") || response.data.includes("Invalid login")) {
    throw new Error("LMS login failed: invalid credentials.");
  }

  return client;
};

const buildSummary = (dues) => {
  if (!dues.length) {
    return "You have no upcoming LMS dues or assignments.";
  }

  return dues
    .map(
      (item) =>
        `${item.courseName}: ${item.name} due ${item.dueDate} (${item.actionUrl})`,
    )
    .join("\n");
};

export const getLmsDues = async ({ lmsUsername, lmsPassword }) => {
  const client = await loginToLms(lmsUsername, lmsPassword);
  const dashboard = await client.get(`${getLmsBaseUrl()}/my/`);
  const sesskeyMatch = String(dashboard.data).match(/"sesskey":"([^"]+)"/);

  if (!sesskeyMatch) {
    throw new Error("LMS session expired or sesskey not found.");
  }

  const sesskey = sesskeyMatch[1];
  const timesortfrom = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const timeline = await client.post(
    `${getLmsBaseUrl()}/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_action_events_by_timesort`,
    [
      {
        index: 0,
        methodname: "core_calendar_get_action_events_by_timesort",
        args: {
          timesortfrom,
          limitnum: 15,
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${getLmsBaseUrl()}/my/`,
      },
    },
  );

  const result = timeline.data?.[0];

  if (result?.error) {
    throw new Error(result.exception?.message || "Failed to fetch LMS dues.");
  }

  const events = result?.data?.events || [];
  const structured = events.map((event) => ({
    id: event.id,
    name: event.name,
    courseName:
      event.course?.fulltitle || event.course?.fullname || "Unknown Course",
    dueTimestamp: event.timesort,
    dueDate: new Date(event.timesort * 1000).toLocaleString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    actionName: event.action?.name || "View",
    actionUrl: event.action?.url || event.url,
  }));

  return {
    structured,
    summary: buildSummary(structured),
  };
};
