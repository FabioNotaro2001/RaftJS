import { RaftNode } from "./components/RaftNode";

let arr =[];
let ids = ["Node1", "Node2", "Node3", "Node4", "Node5"];

for(let i = 15000; i<15010; i+=2){
    arr.push({port1:i, port2:i+1});
}

let nodes = []
for(let i = 0; i<arr.length; i++){
    let arr2 = ids.filter((id) => id!="Node"+(id+1));
    nodes.push(new RaftNode(ids[i], arr[i].port1, arr[i].port2, 3000, 4000, 6000, 7000, 1000))
}