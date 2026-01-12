// src/api/auth.js
export function makeBasicAuth(username, password) {
  return "Basic " + btoa(`${username}:${password}`);
}
