import {expect, test} from '@jest/globals';

import { RaftNode } from "../components/RaftNode.js";
import { State } from "../enums/State.js";
import { LogRecord, UserCreateData } from "../components/Log.js";
import { CommandType } from '../enums/CommandType.js';

function createNodes() {
    let nNodes = 5;
    let ids = [];
    let ports = new Map();
    let nodes = [];

    for(let i = 0; i < nNodes; i++){
        ids.push("Node" + (i + 1));
        ports.set(ids[i], {port1:15000 + i * 2, port2:15000 + i * 2 + 1});
    }

    for(let i = 0; i < nNodes; i++){
        let otherIDs = ids.filter((id) => id != ids[i]);
        let hostIdsMap = new Map();
        for(let i = 0; i < otherIDs.length; i++){
            let id = otherIDs[i];
            hostIdsMap.set("127.0.0." + (i + 1) + ":" + ports.get(id).port1, id);
        }
        nodes.push(new RaftNode(ids[i], ports.get(ids[i]).port1, ports.get(ids[i]).port2, 
                    2000, 3000, 3000, 5000, 1000, 1000, 
                    "127.0.0.1", "root", "password", "portale",
                    hostIdsMap, false, true));
    }

    return nodes;
}

test('Nodes successfully replicate a log entry', async () => {
    let nodes = createNodes();

    nodes.forEach((e) => e.start());

    for (const node of nodes) {
        expect(node.log.length).toBe(0);
    }

    let resolvePromise;
    let promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    setTimeout(() => {
        resolvePromise();
    }, 10000);

    await promise;  // Wait for the election of a leader.

    for (const node of nodes) {
        console.log(node.state);
    }

    let leaderNode = nodes.find(n => n.state == State.LEADER);
    expect(leaderNode).toBeDefined();

    leaderNode.log.push(new LogRecord(leaderNode.currentTerm, CommandType.NEW_USER, new UserCreateData("user", "password"), () => {}));

    resolvePromise = undefined;
    promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    setTimeout(() => {
        resolvePromise();
    }, 6000);

    await promise;  // Wait for log replication.

    for (const node of nodes) {
        expect(node.log.length).toBe(1);
        expect(node.log[0].logData.username).toBe("user");
        expect(node.log[0].logData.password).toBe("password");
    }

    nodes.forEach((e) => e.stop());
}, 25000);

