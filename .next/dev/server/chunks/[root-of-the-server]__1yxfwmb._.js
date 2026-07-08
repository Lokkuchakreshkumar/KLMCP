module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/env.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAppUrl",
    ()=>getAppUrl,
    "getErpBaseUrl",
    ()=>getErpBaseUrl,
    "getGosynkApiBaseUrl",
    ()=>getGosynkApiBaseUrl,
    "getLmsBaseUrl",
    ()=>getLmsBaseUrl,
    "getMongodbUri",
    ()=>getMongodbUri,
    "getTokenSecret",
    ()=>getTokenSecret
]);
const readEnv = (name)=>{
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
};
const getTokenSecret = ()=>readEnv("KLMCP_TOKEN_SECRET");
const getAppUrl = ()=>process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://klmcp.vercel.app";
const getGosynkApiBaseUrl = ()=>readEnv("GOSYNK_API_BASE_URL");
const getErpBaseUrl = ()=>process.env.ERP_BASE_URL?.trim() || "https://newerp.kluniversity.in";
const getLmsBaseUrl = ()=>process.env.LMS_BASE_URL?.trim() || "https://lms.kluniversity.in";
const getMongodbUri = ()=>readEnv("MONGODB_URI");
}),
"[project]/src/lib/gosynk-api-client.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchAttendanceFromGosynk",
    ()=>fetchAttendanceFromGosynk,
    "fetchInternalMarksFromGosynk",
    ()=>fetchInternalMarksFromGosynk,
    "fetchTimetableFromGosynk",
    ()=>fetchTimetableFromGosynk
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.js [app-route] (ecmascript)");
;
const buildEndpoint = (path)=>`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGosynkApiBaseUrl"])().replace(/\/$/, "")}${path}`;
const parseSsePayload = (rawText)=>{
    const lines = rawText.split(/\r?\n/).filter((line)=>line.startsWith("data: ")).map((line)=>line.slice(6).trim()).filter(Boolean);
    let data = null;
    const statuses = [];
    let error = null;
    for (const line of lines){
        if (line === "[DONE]") {
            continue;
        }
        try {
            const parsed = JSON.parse(line);
            if (parsed.status) {
                statuses.push(parsed.status);
            }
            if (parsed.data) {
                data = parsed.data;
            }
            if (parsed.error) {
                error = parsed.error;
            }
        } catch  {
            error = "Received invalid SSE payload from GoSynk.";
        }
    }
    if (error) {
        throw new Error(error);
    }
    if (!data) {
        throw new Error("GoSynk API returned no final data payload.");
    }
    return {
        data,
        statuses
    };
};
const callErpEndpoint = async (path, body)=>{
    const response = await fetch(buildEndpoint(path), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        cache: "no-store"
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || `GoSynk API request failed with status ${response.status}`);
    }
    return parseSsePayload(text);
};
const fetchTimetableFromGosynk = async (userContext)=>callErpEndpoint("/erp/timetable", {
        erpCredentials: {
            username: userContext.erpUsername,
            password: userContext.erpPassword
        },
        academicContext: {
            academicYear: userContext.academicYear,
            semester: userContext.semester
        }
    });
const fetchAttendanceFromGosynk = async (userContext)=>callErpEndpoint("/erp/attendance", {
        erpCredentials: {
            username: userContext.erpUsername,
            password: userContext.erpPassword
        },
        academicContext: {
            academicYear: userContext.academicYear,
            semester: userContext.semester
        }
    });
const fetchInternalMarksFromGosynk = async (userContext, filters = {})=>callErpEndpoint("/erp/internal-marks", {
        erpCredentials: {
            username: userContext.erpUsername,
            password: userContext.erpPassword
        },
        academicContext: {
            academicYear: userContext.academicYear,
            semester: userContext.semester
        },
        courseQuery: filters.courseQuery,
        componentQuery: filters.componentQuery
    });
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/node:url [external] (node:url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}),
"[externals]/node:http [external] (node:http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:http", () => require("node:http"));

module.exports = mod;
}),
"[externals]/node:https [external] (node:https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:https", () => require("node:https"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/string_decoder [external] (string_decoder, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("string_decoder", () => require("string_decoder"));

module.exports = mod;
}),
"[externals]/node:assert [external] (node:assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:assert", () => require("node:assert"));

module.exports = mod;
}),
"[externals]/node:net [external] (node:net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:net", () => require("node:net"));

module.exports = mod;
}),
"[externals]/node:querystring [external] (node:querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:querystring", () => require("node:querystring"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[externals]/node:diagnostics_channel [external] (node:diagnostics_channel, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:diagnostics_channel", () => require("node:diagnostics_channel"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[externals]/node:tls [external] (node:tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:tls", () => require("node:tls"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:zlib [external] (node:zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:zlib", () => require("node:zlib"));

module.exports = mod;
}),
"[externals]/node:perf_hooks [external] (node:perf_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:perf_hooks", () => require("node:perf_hooks"));

module.exports = mod;
}),
"[externals]/node:util/types [external] (node:util/types, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util/types", () => require("node:util/types"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:worker_threads [external] (node:worker_threads, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:worker_threads", () => require("node:worker_threads"));

module.exports = mod;
}),
"[externals]/node:http2 [external] (node:http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:http2", () => require("node:http2"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:console [external] (node:console, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:console", () => require("node:console"));

module.exports = mod;
}),
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:timers [external] (node:timers, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:timers", () => require("node:timers"));

module.exports = mod;
}),
"[externals]/node:dns [external] (node:dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:dns", () => require("node:dns"));

module.exports = mod;
}),
"[project]/src/lib/lms-client.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLmsDues",
    ()=>getLmsDues
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2d$cookiejar$2d$support$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios-cookiejar-support/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/load-parse.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tough$2d$cookie$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tough-cookie/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.js [app-route] (ecmascript)");
;
;
;
;
;
const createClient = ()=>{
    const jar = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tough$2d$cookie$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CookieJar"]();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2d$cookiejar$2d$support$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["wrapper"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].create({
        jar,
        withCredentials: true,
        maxRedirects: 5,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
    }));
};
const loginToLms = async (username, password)=>{
    const client = createClient();
    const loginUrl = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLmsBaseUrl"])()}/login/index.php`;
    const loginPage = await client.get(loginUrl);
    const $ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["load"](loginPage.data);
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
            Referer: loginUrl
        }
    });
    const title = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["load"](response.data)("title").text().toLowerCase();
    if (title.includes("log in") || response.data.includes("Invalid login")) {
        throw new Error("LMS login failed: invalid credentials.");
    }
    return client;
};
const buildSummary = (dues)=>{
    if (!dues.length) {
        return "You have no upcoming LMS dues or assignments.";
    }
    return dues.map((item)=>`${item.courseName}: ${item.name} due ${item.dueDate} (${item.actionUrl})`).join("\n");
};
const getLmsDues = async ({ lmsUsername, lmsPassword })=>{
    const client = await loginToLms(lmsUsername, lmsPassword);
    const dashboard = await client.get(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLmsBaseUrl"])()}/my/`);
    const sesskeyMatch = String(dashboard.data).match(/"sesskey":"([^"]+)"/);
    if (!sesskeyMatch) {
        throw new Error("LMS session expired or sesskey not found.");
    }
    const sesskey = sesskeyMatch[1];
    const timesortfrom = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const timeline = await client.post(`${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLmsBaseUrl"])()}/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_action_events_by_timesort`, [
        {
            index: 0,
            methodname: "core_calendar_get_action_events_by_timesort",
            args: {
                timesortfrom,
                limitnum: 15
            }
        }
    ], {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLmsBaseUrl"])()}/my/`
        }
    });
    const result = timeline.data?.[0];
    if (result?.error) {
        throw new Error(result.exception?.message || "Failed to fetch LMS dues.");
    }
    const events = result?.data?.events || [];
    const structured = events.map((event)=>({
            id: event.id,
            name: event.name,
            courseName: event.course?.fulltitle || event.course?.fullname || "Unknown Course",
            dueTimestamp: event.timesort,
            dueDate: new Date(event.timesort * 1000).toLocaleString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }),
            actionName: event.action?.name || "View",
            actionUrl: event.action?.url || event.url
        }));
    return {
        structured,
        summary: buildSummary(structured)
    };
};
}),
"[project]/src/lib/mcp-server.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createMcpServer",
    ()=>createMcpServer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$modelcontextprotocol$2f$sdk$2f$dist$2f$esm$2f$server$2f$mcp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gosynk$2d$api$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/gosynk-api-client.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lms$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/lms-client.js [app-route] (ecmascript)");
;
;
;
;
const asToolResult = (payload)=>({
        content: [
            {
                type: "text",
                text: JSON.stringify(payload, null, 2)
            }
        ]
    });
const readUserContext = (extra)=>{
    const userContext = extra?.authInfo?.extra?.userContext;
    if (!userContext) {
        throw new Error("User context missing from access token.");
    }
    return userContext;
};
const createMcpServer = ()=>{
    const server = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$modelcontextprotocol$2f$sdk$2f$dist$2f$esm$2f$server$2f$mcp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["McpServer"]({
        name: "klmcp-remote",
        version: "0.2.0"
    });
    const overrideSchema = {
        academicYear: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        semester: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            "odd",
            "even"
        ]).optional()
    };
    server.tool("get_timetable", "Fetches the student's KL University timetable.", overrideSchema, async (args, extra)=>{
        const userContext = readUserContext(extra);
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gosynk$2d$api$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchTimetableFromGosynk"])({
            ...userContext,
            academicYear: args.academicYear || userContext.academicYear,
            semester: args.semester || userContext.semester
        });
        return asToolResult(response);
    });
    server.tool("get_attendance", "Fetches weighted course attendance from KL University ERP.", overrideSchema, async (args, extra)=>{
        const userContext = readUserContext(extra);
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gosynk$2d$api$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchAttendanceFromGosynk"])({
            ...userContext,
            academicYear: args.academicYear || userContext.academicYear,
            semester: args.semester || userContext.semester
        });
        return asToolResult(response);
    });
    server.tool("get_internal_marks", "Fetches internal marks from KL University ERP.", {
        ...overrideSchema,
        courseQuery: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        componentQuery: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    }, async (args, extra)=>{
        const userContext = readUserContext(extra);
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gosynk$2d$api$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchInternalMarksFromGosynk"])({
            ...userContext,
            academicYear: args.academicYear || userContext.academicYear,
            semester: args.semester || userContext.semester
        }, {
            courseQuery: args.courseQuery,
            componentQuery: args.componentQuery
        });
        return asToolResult(response);
    });
    server.tool("get_lms_dues", "Fetches upcoming LMS dues and assignment timeline.", {}, async (_args, extra)=>{
        const userContext = readUserContext(extra);
        const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lms$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLmsDues"])(userContext);
        return asToolResult(response);
    });
    server.tool("diagnose_student_access", "Checks whether ERP and LMS access currently work for the linked student credentials.", overrideSchema, async (args, extra)=>{
        const userContext = readUserContext(extra);
        const academicYear = args.academicYear || userContext.academicYear;
        const semester = args.semester || userContext.semester;
        const diagnostics = {
            erpTimetable: {
                ok: false,
                message: ""
            },
            erpAttendance: {
                ok: false,
                message: ""
            },
            lmsDues: {
                ok: false,
                message: ""
            }
        };
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gosynk$2d$api$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchTimetableFromGosynk"])({
                ...userContext,
                academicYear,
                semester
            });
            diagnostics.erpTimetable = {
                ok: true,
                message: "Timetable access works."
            };
        } catch (error) {
            diagnostics.erpTimetable = {
                ok: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$gosynk$2d$api$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchAttendanceFromGosynk"])({
                ...userContext,
                academicYear,
                semester
            });
            diagnostics.erpAttendance = {
                ok: true,
                message: "Attendance access works."
            };
        } catch (error) {
            diagnostics.erpAttendance = {
                ok: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$lms$2d$client$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getLmsDues"])(userContext);
            diagnostics.lmsDues = {
                ok: true,
                message: "LMS dues access works."
            };
        } catch (error) {
            diagnostics.lmsDues = {
                ok: false,
                message: error instanceof Error ? error.message : String(error)
            };
        }
        return asToolResult({
            diagnostics
        });
    });
    return server;
};
}),
"[project]/src/lib/schemas.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mcpUserContextSchema",
    ()=>mcpUserContextSchema,
    "onboardingSchema",
    ()=>onboardingSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
const onboardingSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    erpUsername: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    erpPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    lmsUsername: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    lmsPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    academicYear: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    semester: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "odd",
        "even"
    ])
});
const mcpUserContextSchema = onboardingSchema.extend({
    issuedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    expiresAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number()
});
}),
"[project]/src/lib/token-crypto.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "issueAccessToken",
    ()=>issueAccessToken,
    "readAccessToken",
    ()=>readAccessToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$schemas$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/schemas.js [app-route] (ecmascript)");
;
;
;
const toBase64Url = (buffer)=>buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const fromBase64Url = (value)=>{
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - normalized.length % 4);
    return Buffer.from(`${normalized}${padding}`, "base64");
};
const getKey = ()=>(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTokenSecret"])()).digest();
const issueAccessToken = (payload)=>{
    const validated = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$schemas$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mcpUserContextSchema"].parse(payload);
    const iv = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(12);
    const cipher = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createCipheriv"])("aes-256-gcm", getKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(validated), "utf8"),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    return [
        iv,
        tag,
        encrypted
    ].map(toBase64Url).join(".");
};
const readAccessToken = (token)=>{
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Malformed access token.");
    }
    const [ivPart, tagPart, encryptedPart] = parts.map(fromBase64Url);
    const decipher = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createDecipheriv"])("aes-256-gcm", getKey(), ivPart);
    decipher.setAuthTag(tagPart);
    const decrypted = Buffer.concat([
        decipher.update(encryptedPart),
        decipher.final()
    ]).toString("utf8");
    const payload = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$schemas$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mcpUserContextSchema"].parse(JSON.parse(decrypted));
    if (payload.expiresAt <= Date.now()) {
        throw new Error("Access token expired.");
    }
    return payload;
};
}),
"[project]/src/app/api/mcp/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "OPTIONS",
    ()=>OPTIONS,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$modelcontextprotocol$2f$sdk$2f$dist$2f$esm$2f$server$2f$webStandardStreamableHttp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@modelcontextprotocol/sdk/dist/esm/server/webStandardStreamableHttp.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mcp$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mcp-server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$token$2d$crypto$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/token-crypto.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/env.js [app-route] (ecmascript)");
;
;
;
;
;
const runtime = "nodejs";
const dynamic = "force-dynamic";
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Last-Event-ID, mcp-protocol-version, mcp-session-id",
    "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version"
};
const unauthorized = (message)=>{
    const appUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$env$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAppUrl"])().replace(/\/$/, "");
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: message
    }, {
        status: 401,
        headers: {
            ...corsHeaders,
            "WWW-Authenticate": `Bearer realm="mcp", resource_metadata="${appUrl}/.well-known/oauth-protected-resource"`
        }
    });
};
const getUserContextFromRequest = (request)=>{
    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
        throw new Error("Missing Bearer token.");
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
        throw new Error("Bearer token is empty.");
    }
    return {
        token,
        userContext: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$token$2d$crypto$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readAccessToken"])(token)
    };
};
const handleMcpRequest = async (request)=>{
    try {
        const { token, userContext } = getUserContextFromRequest(request);
        const transport = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$modelcontextprotocol$2f$sdk$2f$dist$2f$esm$2f$server$2f$webStandardStreamableHttp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WebStandardStreamableHTTPServerTransport"]({
            sessionIdGenerator: undefined
        });
        const server = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mcp$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createMcpServer"])();
        await server.connect(transport);
        const response = await transport.handleRequest(request, {
            authInfo: {
                token,
                clientId: userContext.erpUsername,
                scopes: [
                    "student.read"
                ],
                extra: {
                    userContext
                }
            }
        });
        Object.entries(corsHeaders).forEach(([key, value])=>{
            response.headers.set(key, value);
        });
        return response;
    } catch (error) {
        return unauthorized(error instanceof Error ? error.message : "Unauthorized.");
    }
};
async function OPTIONS() {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](null, {
        status: 204,
        headers: corsHeaders
    });
}
async function GET(request) {
    return handleMcpRequest(request);
}
async function POST(request) {
    return handleMcpRequest(request);
}
async function DELETE(request) {
    return handleMcpRequest(request);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1yxfwmb._.js.map