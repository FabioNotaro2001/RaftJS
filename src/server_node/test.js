import { RaftNode } from "./components/RaftNode.js";

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
    let tempMap = new Map();
    for(let i = 0; i < otherIDs.length; i++){
        let id = otherIDs[i];
        tempMap.set("127.0.0." + (i + 1) + ":" + ports.get(id).port1, id);
    }
    nodes.push(new RaftNode(ids[i], ports.get(ids[i]).port1, ports.get(ids[i]).port2, 3000, 8000, 5000, 10000, 3000, 1500, "", "", "", "",
                tempMap, true, true));
}

nodes.forEach((e) => e.start());

// import { createServer } from "http"

// const host = 'localhost';
// const port = 8000;

// const server = createServer((req, res) => {
//     res.write("TEST");
//     res.end();
// });

// server.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}`);
// });
