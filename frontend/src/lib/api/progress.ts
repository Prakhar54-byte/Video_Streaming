import apiClient from "../api";

export const progressApi = {
    getRoadmapProgress: async (roadmapId: string) => {
        const response = await apiClient.get(`/progress/${roadmapId}`);
        return response.data;
    },

    updateItemStatus: async (roadmapId: string, itemId: string, status: 'not-started' | 'in-progress' | 'completed') => {
        const response = await apiClient.patch(`/progress/${roadmapId}/item/${itemId}`, { status });
        return response.data;
    }
};
