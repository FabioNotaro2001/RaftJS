/**
 * Enumerator for the different states in which a server can be during the consensus algorithm.
 */
export const State = Object.freeze({
    FOLLOWER : "follower",
    CANDIDATE : "candidate",
    LEADER : "leader"
});