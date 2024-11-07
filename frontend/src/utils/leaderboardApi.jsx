const API_BASE_URL = "http://localhost:3000/api/leaderboards";

export const getLeaderboardByKey = async (key) => {
    try {
        const token = localStorage.getItem("user");
        if (!token) {
            throw new Error("Token not found");
        }
        
        const response = await fetch(`${API_BASE_URL}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Error on request: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting leaderboards:", error);
        return [];
    }
}