// Fix: Add global declarations for Google APIs that are loaded from scripts
declare global {
  // This makes the google global variable available with its types.
  namespace google {
    namespace accounts {
      namespace oauth2 {
        interface TokenResponse {
          access_token: string;
          error?: string;
          error_description?: string;
        }
        interface TokenClient {
          requestAccessToken(overrideConfig?: { prompt: string }): void;
        }
        function initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (tokenResponse: TokenResponse) => void;
        }): TokenClient;
        function revoke(token: string, done: () => void): void;
      }
    }
  }
  // This makes the gapi global variable available with its types.
  namespace gapi {
    function load(libraries: string, callback: () => void): void;
    namespace client {
      function init(args: any): Promise<void>;
    }
  }
}

export interface Preset {
  cat: string;
  label: string;
  outfit: string;
}

export interface LegwearOption {
  v: string;
  t: string;
}

export interface PersonState {
    id: number;
    ageSelect: string;
    characterSelect: string;
    characterSelect2: string;
    hairStyle: string;
    hairColor: string;
    hairLength: string;
    hairWind: string;
    hat: string;
    glasses: string;
    earrings: string;
    necklace: string;
    bag: string;
    weapon: string;
    weaponQuantity: string;
    hasCurvyFigure: boolean;
    allowPants: boolean;
    hasHourglassWaist: boolean;
    hasRippedBody: boolean;
    
    // Clothing properties moved from PromptState
    customOutfit: string;
    metallicOutfit: boolean;
    pantyhose: string;
    pantyhoseMetallic: boolean;
    stockings: string;
    stockingsMetallic: boolean;
    stockingLength: string;
    leggings: string;
    leggingsMetallic: boolean;
    socks: string;
    socksMetallic: boolean;
    sockLength: string;
    shoeQuick: string;
    shoe: string;
}

export interface PromptState {
  aspect: string;
  customAR: string;
  cameraBody: string;
  lensSelect: string;
  exposure: string;
  wb: string;
  cameraComposition: string;
  timeOfDay: string;
  weather: string;
  background: string;
  atmosphere: string;
  removeBackground: boolean;
  
  numberOfPeople: string;
  people: PersonState[];

  customSubject: string;
  pose: string;
  vehicle: string;
  pet: string;
  
  eraSelect: string;
  activeStyle: string;
  fixedPrompts: string[];
}

export interface AnalyzedData {
    outfit: string;
}

export interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

export interface UploadedImageState extends ImagePart {
    file: File;
    previewUrl: string;
}

export type VisionFeature = 'analyze' | 'edit' | 'background' | 'pose' | 'scene' | 'video' | 'live' | 'realify';

// Fix: Define GoogleUser and GoogleDriveAuthState types
export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export interface GoogleDriveAuthState {
  isInitialized: boolean;
  token: google.accounts.oauth2.TokenResponse | null;
  user: GoogleUser | null;
  isAutoSaveEnabled: boolean;
}