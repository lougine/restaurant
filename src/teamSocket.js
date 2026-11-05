const API_ROOT = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const SOCKET_ROOT = API_ROOT.replace(/\/api$/i, '');

let clientPromise;

function loadSocketClient() {
  if (window.io) return Promise.resolve(window.io);
  if (clientPromise) return clientPromise;

  clientPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${SOCKET_ROOT}/socket.io/socket.io.js`;
    script.async = true;
    script.onload = () => window.io ? resolve(window.io) : reject(new Error('Live updates could not be loaded.'));
    script.onerror = () => reject(new Error('Live updates are unavailable.'));
    document.head.appendChild(script);
  });

  return clientPromise;
}

export async function connectTeamSocket(token) {
  const ioClient = await loadSocketClient();
  return ioClient(SOCKET_ROOT, { auth: { token } });
}
