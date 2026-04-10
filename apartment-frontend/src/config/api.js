const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:5001";
const PROPERTY_URL = import.meta.env.VITE_PROPERTY_URL || "http://localhost:5002";
const RESIDENCY_URL = import.meta.env.VITE_RESIDENCY_URL || "http://localhost:5003";

// Helper to build image URLs — works with both old filenames and MongoDB ObjectIds
function imageUrl(imageKey) {
    return `${PROPERTY_URL}/uploads/${imageKey}`;
}

export { AUTH_URL, PROPERTY_URL, RESIDENCY_URL, imageUrl };
