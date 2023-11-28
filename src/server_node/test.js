import { RaftNode } from "./components/RaftNode.js";

let nNodes = 5;
let ids = [];
let ports = [];
let nodes = [];

for(let i = 0; i < nNodes; i++){
    ids.push("Node" + (i + 1));
    ports.push({port1:15000 + i * 2, port2:15000 + i * 2 + 1});
}

for(let i = 0; i < nNodes; i++){
    let otherIDs = ids.filter((id) => id != ids[i]);
    let tempMap = new Map();
    for(let i = 0; i < otherIDs.length; i++){
        let id = otherIDs[i];
        tempMap.set("127.0.0." + (i + 1), id);
    }
    nodes.push(new RaftNode(ids[i], ports[i].port1, ports[i].port2, 8000, 15000, 8000, 15000, 3000, 4000, "", "", "", "",
                tempMap, true, true));
}

nodes.forEach((e) => e.start());

