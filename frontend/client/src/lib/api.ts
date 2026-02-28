import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

export const getGoogleAuthUrl = () => `${API_BASE}/auth/google/authorize`;
export const getGoogleStatus = () => api.get('/auth/google/status');
export const disconnectGoogle = () => api.post('/auth/google/disconnect');
export const getPinterestAuthUrl = () => `${API_BASE}/auth/pinterest/authorize`;
export const getPinterestStatus = () => api.get('/auth/pinterest/status');
export const disconnectPinterest = () => api.post('/auth/pinterest/disconnect');

export const getPhotos = (params?: { status?: string; limit?: number; offset?: number }) => api.get('/photos', { params });
export const updatePhoto = (id: string, data: { status?: string }) => api.patch(`/photos/${id}`, data);
export const syncPhotos = () => api.post('/photos/sync');
export const getPhotoStats = () => api.get('/photos/stats/summary');

export const generateTags = (photoId: string) => api.post(`/tags/generate/${photoId}`);
export const updateTags = (photoId: string, tags: string[]) => api.put(`/tags/${photoId}`, { tags });

export const getQueue = () => api.get('/queue');
export const addToQueue = (data: { photo_id: string; board_id: string; title?: string; link_url?: string }) => api.post('/queue', data);
export const bulkAddToQueue = (photoIds: string[]) => api.post('/queue/bulk', { photo_ids: photoIds });
export const reorderQueueItem = (pinId: string, newPosition: number) => api.patch(`/queue/${pinId}/reorder`, { new_position: newPosition });
export const removeFromQueue = (pinId: string) => api.delete(`/queue/${pinId}`);
export const pauseQueue = () => api.post('/queue/pause');
export const resumeQueue = () => api.post('/queue/resume');

export const getSettings = () => api.get('/settings');
export const updateSettings = (data: Partial<{ drive_folder_id: string; posting_interval_hours: number; default_post_time: string }>) => api.put('/settings', data);
export const getBoardMappings = () => api.get('/settings/board-mappings');
export const updateBoardMapping = (category: string, data: { board_id?: string; board_name?: string; link_url?: string }) => api.put(`/settings/board-mappings/${category}`, data);
export const fetchPinterestBoards = () => api.get('/settings/pinterest-boards');
