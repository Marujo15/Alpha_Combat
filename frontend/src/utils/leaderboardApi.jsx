const apiUrl = import.meta.env.VITE_API_URL;

export const getLeaderboardByKey = async (key) => {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user ? user.token : null;
        
        if (!token) {
            throw new Error("Token not found");
        }
        
        const response = await fetch(`${apiUrl}/leaderboards`, {
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