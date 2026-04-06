import apiClient from "../api";

export const roadmapApi = {
    getAllRoadmaps: async (category?: string) => {
        const response = await apiClient.get("/roadmaps", { params: { category } });
        return response.data;
    },

    getRoadmapById: async (id: string) => {
        const response = await apiClient.get(`/roadmaps/${id}`);
        return response.data;
    },

    enrollInRoadmap: async (id: string) => {
        const response = await apiClient.post(`/roadmaps/${id}/enroll`);
        return response.data;
    },

    getMyEnrolledRoadmaps: async () => {
        const response = await apiClient.get("/roadmaps/enrolled");
        return response.data;
    }
};
