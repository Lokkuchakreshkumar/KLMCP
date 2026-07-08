import { MongoClient } from "mongodb";
import { getMongodbUri } from "@/lib/env";

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(getMongodbUri());
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(getMongodbUri());
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  const connectedClient = await clientPromise;
  const db = connectedClient.db("klmcp");
  return { client: connectedClient, db };
}
