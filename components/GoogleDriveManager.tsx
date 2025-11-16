import React, { useEffect, useCallback } from 'react';
import { t, Language } from '../localization/i18n';
import { GoogleDriveAuthState } from '../types';

interface GoogleDriveManagerProps {
  auth: GoogleDriveAuthState;
  setAuth: React.Dispatch<React.SetStateAction<GoogleDriveAuthState>>;
  language: Language;
  addLog: (message: string) => void;
}

// This should be configured in the execution environment, similar to API_KEY.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({ auth, setAuth, language, addLog }) => {

  const getTokenCallback = useCallback((tokenResponse: google.accounts.oauth2.TokenResponse) => {
    if (tokenResponse.error) {
        addLog(`Google Auth Error: ${tokenResponse.error_description || 'Unknown error'}`);
        return;
    }

    setAuth(prev => ({ ...prev, token: tokenResponse }));
    addLog('Google Drive connected successfully.');

    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error.message);
      }
      setAuth(prev => ({
        ...prev,
        user: { name: data.name, email: data.email, picture: data.picture }
      }));
    }).catch(err => {
        addLog(`Failed to fetch user info: ${err.message}`);
    });
  }, [setAuth, addLog]);

  const initializeClients = useCallback(() => {
    // Fix: Remove 'window.' prefix as gapi and google are now global types.
    if (gapi && gapi.client && google && google.accounts) {
      if (!CLIENT_ID) {
        if (!auth.isInitialized) {
          setAuth(prev => ({ ...prev, isInitialized: true }));
        }
        return;
      }

      if (!auth.isInitialized) {
          // Fix: Remove 'window.' prefix.
          gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          }).then(() => {
            setAuth(prev => ({ ...prev, isInitialized: true }));
          }).catch(err => {
            addLog(`GAPI client init error: ${err.message || String(err)}`);
            setAuth(prev => ({ ...prev, isInitialized: true }));
          });
      }

      if (!tokenClient) {
          // Fix: Remove 'window.' prefix.
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: getTokenCallback,
          });
      }
    } else {
      setTimeout(initializeClients, 300);
    }
  }, [auth.isInitialized, setAuth, addLog, getTokenCallback]);
  
  useEffect(() => {
    // Fix: Remove 'window.' prefix.
    if (gapi) {
        // Fix: Remove 'window.' prefix.
        gapi.load('client', initializeClients);
    } else {
        setTimeout(initializeClients, 300);
    }
  }, [initializeClients]);

  const handleAuthClick = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      addLog('Google authentication client is not ready.');
    }
  };

  const handleSignoutClick = () => {
    const token = auth.token;
    // Fix: Remove 'window.' prefix.
    if (token && google) {
      // Fix: Remove 'window.' prefix.
      google.accounts.oauth2.revoke(token.access_token, () => {
        setAuth(prev => ({ ...prev, token: null, user: null }));
        localStorage.removeItem('googleDriveFolderId');
        addLog('Disconnected from Google Drive.');
      });
    }
  };

  const handleAutoSaveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setAuth(prev => ({ ...prev, isAutoSaveEnabled: isEnabled }));
    localStorage.setItem('googleDriveAutoSave', JSON.stringify(isEnabled));
    addLog(`Auto-save to Google Drive ${isEnabled ? 'enabled' : 'disabled'}.`);
  };

  if (!auth.isInitialized || (CLIENT_ID && !tokenClient)) {
    return <div className="text-xs text-slate-400 p-2 text-center">Initializing Google Drive...</div>;
  }
  
  if (!CLIENT_ID) {
    return <div className="text-xs text-amber-400 p-2 text-center bg-amber-900/30 rounded-md">Google Client ID is not configured.</div>;
  }

  if (auth.user && auth.token) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-md">
            <img src={auth.user.picture} alt="User" className="w-8 h-8 rounded-full" />
            <div className="text-xs overflow-hidden">
                <div className="font-semibold truncate">{auth.user.name}</div>
                <div className="text-slate-400 truncate">{auth.user.email}</div>
            </div>
            <button onClick={handleSignoutClick} className="ml-auto flex-shrink-0 text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">
                Disconnect
            </button>
        </div>
        <div className="flex items-center gap-2">
            <input type="checkbox" id="gdrive-autosave" checked={auth.isAutoSaveEnabled} onChange={handleAutoSaveToggle} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
            <label htmlFor="gdrive-autosave" className="text-sm text-slate-300">Auto-save generated images to Drive</label>
        </div>
      </div>
    );
  }

  return (
    <button onClick={handleAuthClick} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:bg-slate-500" disabled={!tokenClient}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.152 10.347L12.001 22.25l-7.15-11.903H19.152zM9.06 9.347l2.94-4.899 2.94 4.899H9.06zM3 15.25l3.435-5.903L3 3.75h18l-3.435 5.597L21 15.25H3z"></path></svg>
        Connect to Google Drive
    </button>
  );
};

export default GoogleDriveManager;