// Environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const MOS_APP_KEY = import.meta.env.VITE_MOS_APP_KEY;
const LOGIN_ENDPOINT = '/login/2048/miniAppLogin';

// vConsole for local/test environments
if (
    import.meta.env.MODE === 'development' ||
    import.meta.env.MODE === 'test' ||
    import.meta.env.VITE_ENV === 'local' ||
    import.meta.env.VITE_ENV === 'test'
) {
    import('vconsole').then(({ default: VConsole }) => {
        // eslint-disable-next-line no-new
        new VConsole();
        console.log('[vConsole] Initialized for development/testing');
    });
}

function performLogin() {
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
        // Token exists, trigger game progress loading
        setTimeout(loadGameProgress, 500);
        return;
    }

    function tryMosLogin() {
        if (typeof mos === 'undefined') {
            setTimeout(tryMosLogin, 1000);
            return;
        }

        setTimeout(() => {
            mos.login(MOS_APP_KEY).then((res) => {

                const code = res.code || (res.data && res.data.code);
                if (!code) {
                    setTimeout(tryMosLogin, 2000);
                    return;
                }


                setTimeout(() => {
                    axios.post(API_BASE_URL + LOGIN_ENDPOINT, { code }).then(({ data }) => {
                        localStorage.setItem('token', data.data.token);
                        localStorage.setItem('isMosLogin', true);

                        // After login success, trigger game progress loading
                        setTimeout(loadGameProgress, 500);
                    }).catch((err) => {
                        console.error('[MOS] Backend login error:', err);
                    });
                }, 500);

            }).catch((err) => {
                setTimeout(tryMosLogin, 3000);
            });
        }, 1000);
    }

    tryMosLogin();
}

window.addEventListener('load', performLogin);

function loadGameProgress() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('[API] No token found, using localStorage only');
        return;
    }

    getGameProgress().then((apiResponse) => {
        // console.log('[API] Game progress response:', apiResponse);
        if (apiResponse && apiResponse.gameState && apiResponse.gameState.grid && window.gameManager) {
            // API has valid game state - override localStorage
            window.gameManager.restoreFromAPI(apiResponse);
        } else if (window.gameManager) {
            // No API data, use localStorage state
            window.gameManager.restoreFromAPI(null);
        }
    }).catch((error) => {
        // On error, use localStorage state
        if (window.gameManager) {
            window.gameManager.restoreFromAPI(null);
        }
    });
}

// loadGameProgress is now called by performLogin after login success

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

async function refreshToken() {
    return new Promise((resolve, reject) => {
        if (typeof mos === 'undefined') {
            reject(new Error('MOS SDK not available'));
            return;
        }

        mos.login(MOS_APP_KEY).then((res) => {
            const code = res.code || (res.data && res.data.code);
            if (!code) {
                reject(new Error('No code received from MOS'));
                return;
            }

            axios.post(API_BASE_URL + LOGIN_ENDPOINT, { code }).then(({ data }) => {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('isMosLogin', true);
                resolve(data.data.token);
            }).catch((err) => {
                reject(err);
            });
        }).catch((err) => {
            reject(err);
        });
    });
}

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.status === 401) {

            localStorage.removeItem('token');
            localStorage.removeItem('isMosLogin');

            try {
                await refreshToken();
                const originalRequest = error.config;
                return apiClient(originalRequest);
            } catch (refreshError) {
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

function saveGameProgress(gameState) {
    const bestScore = localStorage.getItem('bestScore') || gameState.score || 0;

    return apiClient.post('/progress/2048/save', {
        gameState: gameState,
        bestScore: parseInt(bestScore)
    }).then((response) => {
        return response;
    }).catch((error) => {
        return Promise.reject(error);
    });
}

function getGameProgress() {
    return apiClient.get('/progress/2048/get').then(({ data }) => {
        return data.data;
    }).catch((error) => {
        return Promise.resolve(null);
    });
}

function clearGameProgress() {
    return apiClient.post('/progress/2048/clear').then((response) => {
        return response;
    }).catch((error) => {
        return Promise.reject(error);
    });
}

window.ApiService = {
    saveGameProgress,
    getGameProgress,
    clearGameProgress
}; 