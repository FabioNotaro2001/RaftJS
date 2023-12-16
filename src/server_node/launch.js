import { RaftNode } from "./components/RaftNode.js";
import fs from 'fs';

/**
 * @typedef {{
*      port1: Number,
*      port2: Number,
*      protocolConfig: {
*          minLeaderTimeout: Number,
*          maxLeaderTimeout: Number,
*          minElectionTimeout: Number,
*          maxElectionTimeout: Number,
*          minElectionDelay: Number,
*          heartbeatTimeout: Number
*      }, 
*      ownId: String,
*      dbHost: String,
*      dbUser: String,
*      dbPassword: String,
*      dbDatabase: String, 
*      otherNodes: Array<{
*          host: String,
*          id: String,
*          port: Number
*      }>
* }} MyObjectType
*/
const config = JSON.parse(fs.readFileSync("./src/server_node/cluster-config.json", "utf8"));

let nNodes = config.otherNodes.length + 1;

/** @type {Map<String, String>} */
let otherNodes = new Map();

config.otherNodes.forEach((node) => {
    otherNodes.set(node.id, node.host + ":" + node.port);
});

new RaftNode(config.ownId, config.port1, config.port2, 
            config.protocolConfig.minLeaderTimeout, config.protocolConfig.maxLeaderTimeout, 
            config.protocolConfig.minElectionTimeout, config.protocolConfig.maxElectionTimeout, 
            config.protocolConfig.minElectionDelay, config.protocolConfig.heartbeatTimeout, 
            config.dbHost, config.dbUser, config.dbPassword, config.dbDatabase,
            otherNodes).start();