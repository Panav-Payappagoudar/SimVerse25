export function getLocalUser() {
  const key = "simverse_user";
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  const user = {
    id: Math.random().toString(36).slice(2, 10),
    name: `User-${Math.floor(Math.random() * 1000)}`,
    color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`,
  };
  try {
    localStorage.setItem(key, JSON.stringify(user));
  } catch (e) {}
  return user;
}
