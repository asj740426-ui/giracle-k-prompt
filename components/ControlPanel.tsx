import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { t, Language } from '../localization/i18n';
import type { Preset, PromptState, AnalyzedData, PersonState, VisionFeature, UploadedImageState } from '../types';
import {
  ASPECT_RATIOS,
  CAMERA_BODIES,
  LENSES,
  WB_OPTIONS,
  CAMERA_COMPOSITION_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  WEATHER_OPTIONS,
  BACKGROUND_OPTIONS,
  ATMOSPHERE_OPTIONS,
  AGE_OPTIONS,
  CHARACTER_OPTIONS,
  NUMBER_OF_PEOPLE_OPTIONS,
  HAIR_STYLE_OPTIONS,
  LENGTH_INCOMPATIBLE_HAIRSTYLES,
  HAIR_LENGTH_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAT_OPTIONS,
  GLASSES_OPTIONS,
  EARRING_OPTIONS,
  NECKLACE_OPTIONS,
  BAG_OPTIONS,
  WEAPON_OPTIONS,
  WEAPON_QUANTITY_OPTIONS,
  PLURAL_WEAPONS,
  VEHICLE_OPTIONS,
  PET_OPTIONS,
  ERA_OPTIONS,
  FIXED_PROMPTS,
  LEGWEAR_OPTIONS,
  STOCKINGS_OPTIONS,
  STOCKING_LENGTH_OPTIONS,
  LEGGINGS_OPTIONS,
  SOCKS_OPTIONS,
  SOCK_LENGTH_OPTIONS,
  SHOE_QUICK_OPTIONS,
  SHOES,
  LEGWEAR_PICKER_COLORS,
  COLORS_ARR,
  FINISHES_ARR,
  COLOR_NAME_TO_HEX_MAP,
  STYLE_PROMPT_MAP,
} from '../constants';
import Section from './Section';
import LiveConversation from './LiveConversation';
import { 
    any,
    suggestShoes,
    randomLegwear,
    generateRandomSchoolUniform,
    generateRandomSemiFormalOutfit,
    generateRandomHanbokOutfit,
    generateRandomDenimOutfit,
    generateRandomTennisOutfit,
    generateRandomKpopOutfit,
    generateRandomTraditionalHanbok,
    generateRandomClassicSuit,
    generateRandomKimonoOutfit,
    generateRandomQipaoOutfit,
    generateRandomAoDaiOutfit,
    generateRandomSariOutfit,
    generateRandomKiltOutfit,
    generateRandomDirndlOutfit,
    generateRandomChutThaiOutfit,
    generateRandomKebayaOutfit,
    generateRandomKlederdrachtOutfit,
    generateRandomLongyiOutfit,
    generateRandomDeelOutfit,
    generateRandomKaftanOutfit,
    generateRandomTunicOutfit,
    generateRandomLederhosenOutfit,
    generateRandomParisianOutfit,
    generateRandomTogaOutfit,
    generateRandomDandyOutfit,
    generateRandomFlamencoOutfit,
    generateRandomSarafanOutfit,
    generateRandomKontuszOutfit,
    generateRandomVyshyvankaOutfit,
    generateRandomBunadOutfit,
    generateRandomFolkdraktSEOutfit,
    generateRandomFolkedragtDKOutfit,
    generateRandomKansallispukuOutfit,
    generateRandomCosplayStreetFighter,
    generateRandomCosplayTekken,
    generateRandomCosplayKOF,
    generateRandomCosplaySailorMoon,
    generateRandomCosplayDragonBall,
    generateRandomCosplayDemonSlayer,
    generateRandomCosplayTokyoRevengers,
    generateRandomCosplayGenshinImpact,
    generateRandomKnightCosplay,
    generateRandomModernMaidOutfit,
    generateRandomChefUniform,
    generateRandomModernNunOutfit,
    generateRandomTraditionalNunOutfit,
    generateRandomTraditionalNurseOutfit,
    generateRandomModernNurseOutfit,
    generateRandomTraditionalKimonoOutfit,
    generateRandomTraditionalQipaoOutfit,
    generateRandomTraditionalAoDaiOutfit,
    generateRandomTraditionalSariOutfit,
    generateRandomTraditionalChutThaiOutfit,
    generateRandomTraditionalKebayaOutfit,
    generateRandomTraditionalLongyiOutfit,
    generateRandomTraditionalDeelOutfit,
    generateRandomTraditionalKaftanOutfit,
    generateRandomTraditionalTunicOutfit,
    generateRandomTraditionalTogaOutfit,
    generateRandomTraditionalFlamencoOutfit,
    generateRandomTraditionalKiltOutfit,
    generateRandomTraditionalDirndlOutfit,
    generateRandomTraditionalKlederdrachtOutfit,
    generateRandomTraditionalSarafanOutfit,
    generateRandomTraditionalVyshyvankaOutfit,
    generateRandomTraditionalKontuszOutfit,
    generateRandomTraditionalBunadOutfit,
    generateRandomTraditionalFolkdraktSEOutfit,
    generateRandomTraditionalFolkedragtDKOutfit,
    generateRandomTraditionalKansallispukuOutfit,
    generateRandomBaseballOutfit,
    generateRandomSoccerOutfit,
    generateRandomBasketballOutfit,
    generateRandomVolleyballOutfit,
    generateRandomGolfOutfit,
    generateRandomProWrestlingOutfit,
    generateRandomIceHockeyOutfit,
    generateRandomAmericanFootballOutfit,
    generateRandomFieldHockeyOutfit,
    generateRandomLacrosseOutfit,
    generateRandomBowlingOutfit,
    generateRandomTrackAndFieldOutfit,
    generateRandomBoxingOutfit,
    generateRandomFencingOutfit,
    generateRandomArcheryOutfit,
    generateRandomPilatesOutfit,
    generateRandomRhythmicGymnasticsLeotard,
    generateRandomBallroomGown,
    generateRandomLatinDanceDress,
    generateRandomTapDanceOutfit,
    generateRandomJazzDanceOutfit,
    generateRandomHiphopDanceOutfit,
    generateRandomModernDanceOutfit,
    generateRandomSalsaDress,
    generateRandomTangoDress,
    generateRandomMarathonOutfit,
    generateRandomTableTennisUniform,
    generateRandomBadmintonUniform,
    generateRandomDollStyleDressOutfit,
    generateRandomGothicDollDressOutfit,
    analyzeBackgroundImage,
    analyzePoseAndAction,
    createDefaultPerson,
    readFileAsDataUrl,
    performGeminiAnalysis,
    generateColoredPantyhose,
    hexToColorName,
    createVideoPromptFromIdea,
    generateBackgroundFromAtmosphere,
} from '../utils';

interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

interface DirectBackgroundImage {
    base64: string;
    mimeType: string;
    previewUrl: string;
}

interface ControlPanelProps {
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  promptState: PromptState;
  setPromptState: React.Dispatch<React.SetStateAction<PromptState>>;
  addLog: (message: string) => void;
  isGenerating: boolean;
  analyzedData: AnalyzedData | null;
  setAnalyzedData: React.Dispatch<React.SetStateAction<AnalyzedData | null>>;
  onAnalyzeImage: (base64Data: string, mimeType: string) => Promise<void>;
  onEditImage: (images: ImagePart[], editPrompt: string) => Promise<void>;
  onRealifyImage: (sourceImage: ImagePart) => Promise<void>;
  editPrompt: string;
  setEditPrompt: React.Dispatch<React.SetStateAction<string>>;
  isEditPromptDirty: boolean;
  setIsEditPromptDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setLastEditedImage: React.Dispatch<React.SetStateAction<ImagePart | null>>;
  directBackgroundImage: DirectBackgroundImage | null;
  setDirectBackgroundImage: React.Dispatch<React.SetStateAction<DirectBackgroundImage | null>>;
  isAnalyzingScene: boolean;
  onAnalyzeScene: (title: string) => void;
  activePersonIndex: number;
  setActivePersonIndex: React.Dispatch<React.SetStateAction<number>>;
  isAnalyzingOutfit: boolean;
  onAnalyzeCharacterOutfit: (title: string, character: string) => void;
  isGeneratingVideo: boolean;
  onGenerateVideoFromPrompt: (prompt: string, image?: ImagePart) => Promise<void>;
  onStyleButtonClick: (styleKey: string) => void;
  onSora2StyleTransfer: () => void;
  onCustomStyleTransfer: (stylePrompt: string) => void;
  onColorizeImage: (color: string) => void;
  isColorizing: boolean;
  setIsColorizing: React.Dispatch<React.SetStateAction<boolean>>;
  language: Language;
  activeVisionFeature: VisionFeature;
  setActiveVisionFeature: React.Dispatch<React.SetStateAction<VisionFeature>>;
  uploadedImageData1: UploadedImageState | null;
  setUploadedImageData1: React.Dispatch<React.SetStateAction<UploadedImageState | null>>;
  uploadedImageDataRealify: UploadedImageState | null;
  setUploadedImageDataRealify: React.Dispatch<React.SetStateAction<UploadedImageState | null>>;
}

const getEnglishValue = (value: string): string => {
  return (value && value !== '__random__' && value !== '') ? value : '';
};

const getUiModifications = (person: PersonState, state: PromptState): string[] => {
    const modifications: string[] = [];

    if (state.customSubject) {
        modifications.push(`Subject: ${state.customSubject}`);
    } else {
        const character1 = getEnglishValue(person.characterSelect);
        const character2 = getEnglishValue(person.characterSelect2);
        const age = getEnglishValue(person.ageSelect);

        let characterDesc = '';
        if (character1 && character2 && character1 !== character2) {
            characterDesc = `half-${character1}, half-${character2}`;
        } else if (character1) {
            characterDesc = character1;
        } else if (character2) { // Edge case
            characterDesc = character2;
        }

        if (age || characterDesc) {
            modifications.push(`Subject Description: ${[age, characterDesc].filter(Boolean).join(' ')}`);
        }
        
        const hairStyle = getEnglishValue(person.hairStyle);
        const hairColor = getEnglishValue(person.hairColor);
        if (hairStyle || hairColor) {
            modifications.push(`Hair: ${[hairColor, hairStyle].filter(Boolean).join(' ')}`);
        }
        const hat = getEnglishValue(person.hat);
        if (hat) modifications.push(`Wear a ${hat}.`);
        
        const glasses = getEnglishValue(person.glasses);
        if (glasses) modifications.push(`Wear ${glasses}.`);

        const earrings = getEnglishValue(person.earrings);
        if (earrings) modifications.push(`Wear ${earrings}.`);

        const necklace = getEnglishValue(person.necklace);
        if (necklace) modifications.push(`Wear a ${necklace}.`);
        
        const bag = getEnglishValue(person.bag);
        if (bag) modifications.push(`Carry a ${bag}.`);
    }

    return modifications;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  presets,
  setPresets,
  promptState,
  setPromptState,
  addLog,
  isGenerating,
  analyzedData,
  setAnalyzedData,
  onAnalyzeImage,
  onEditImage,
  onRealifyImage,
  editPrompt,
  setEditPrompt,
  isEditPromptDirty,
  setIsEditPromptDirty,
  setLastEditedImage,
  directBackgroundImage,
  setDirectBackgroundImage,
  isAnalyzingScene,
  onAnalyzeScene,
  activePersonIndex,
  setActivePersonIndex,
  isAnalyzingOutfit,
  onAnalyzeCharacterOutfit,
  isGeneratingVideo,
  onGenerateVideoFromPrompt,
  onStyleButtonClick,
  onSora2StyleTransfer,
  onCustomStyleTransfer,
  onColorizeImage,
  isColorizing,
  setIsColorizing,
  language,
  activeVisionFeature,
  setActiveVisionFeature,
  uploadedImageData1,
  setUploadedImageData1,
  uploadedImageDataRealify,
  setUploadedImageDataRealify,
}) => {
  const [presetSearch, setPresetSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [uploadedImageData2, setUploadedImageData2] = useState<UploadedImageState | null>(null);
  
  const [analysisError, setAnalysisError] = useState('');
  const [isDragging1, setIsDragging1] = useState(false);
  const [isDragging2, setIsDragging2] = useState(false);
  
  const [cinematicTitle, setCinematicTitle] = useState('');
  const [mangaTitle, setMangaTitle] = useState('');
  const [mangaCharacter, setMangaCharacter] = useState('');
  
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBgImage, setPendingBgImage] = useState<DirectBackgroundImage | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isDraggingBg, setIsDraggingBg] = useState(false);

  const poseFileInputRef = useRef<HTMLInputElement>(null);
  const [poseImageFile, setPoseImageFile] = useState<File | null>(null);
  const [poseImagePreview, setPoseImagePreview] = useState<string>('');
  const [isAnalyzingPose, setIsAnalyzingPose] = useState(false);
  const [isDraggingPose, setIsDraggingPose] = useState(false);
  const [showShoeDetail, setShowShoeDetail] = useState(false);
  const [isAnalyzingSourceOutfit, setIsAnalyzingSourceOutfit] = useState(false);
  const [isGeneratingAtmosphere, setIsGeneratingAtmosphere] = useState(false);
  
  const [videoGenPrompt, setVideoGenPrompt] = useState('');
  const [videoSourceImage, setVideoSourceImage] = useState<UploadedImageState | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const fileInputRefVideo = useRef<HTMLInputElement>(null);
  const [animeStyleInput, setAnimeStyleInput] = useState('');
  const [videoIdeaInput, setVideoIdeaInput] = useState('');
  const [isCreatingVideoPrompt, setIsCreatingVideoPrompt] = useState(false);

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    const allCategories = Array.from(new Set(presets.map(p => p.cat)));
    const initialState: Record<string, boolean> = {};
    allCategories.forEach(category => {
      if (typeof category === 'string') {
        initialState[category] = true;
      }
    });
    return initialState;
  });
  
  const [showPantyhoseColorPicker, setShowPantyhoseColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const pantyhoseModesRef = useRef<Record<number, string>>({});
  const pantyhoseColorsRef = useRef<Record<number, string>>({});

  const [showLeggingsColorPicker, setShowLeggingsColorPicker] = useState(false);
  const leggingsColorPickerRef = useRef<HTMLDivElement>(null);
  const leggingsModesRef = useRef<Record<number, string>>({});
  const leggingsColorsRef = useRef<Record<number, string>>({});

  const [showStockingsColorPicker, setShowStockingsColorPicker] = useState(false);
  const stockingsColorPickerRef = useRef<HTMLDivElement>(null);
  const stockingsModesRef = useRef<Record<number, string>>({});
  const stockingsColorsRef = useRef<Record<number, string>>({});

  const [showSocksColorPicker, setShowSocksColorPicker] = useState(false);
  const socksColorPickerRef = useRef<HTMLDivElement>(null);
  const socksModesRef = useRef<Record<number, string>>({});
  const socksColorsRef = useRef<Record<number, string>>({});

  const fileInputRefRealify = useRef<HTMLInputElement>(null);
  const [isDraggingRealify, setIsDraggingRealify] = useState(false);

  const hairWindOptions = [
    { v: '', t: 'controlPanel.hairWind.none' },
    { v: 'weak', t: 'controlPanel.hairWind.weak' },
    { v: 'medium', t: 'controlPanel.hairWind.medium' },
    { v: 'strong', t: 'controlPanel.hairWind.strong' },
  ];

  const getLegwearValue = (mode: string, color?: string, length?: string, metallic?: boolean): string => {
      if (!mode) return '';
      
      if (mode.startsWith('random-')) {
          return randomLegwear(mode, color, length, metallic);
      }
  
      let result = mode;

      if (color) {
          const replaceableColors = ['black', 'grey', 'white'];
          for (const replaceableColor of replaceableColors) {
              if (result.startsWith(replaceableColor + ' ')) {
                  result = color + result.substring(replaceableColor.length);
              }
          }
      }

      if (metallic) {
        const materials = ['cotton', 'faux-leather', 'wet-look', ...FINISHES_ARR];
        let replaced = false;
        for (const material of materials) {
            if (result.includes(material)) {
                result = result.replace(material, 'metallic');
                replaced = true;
                break;
            }
        }
        if (!replaced && !result.startsWith('metallic')) {
            result = `metallic ${result}`;
        }
      }

      return result;
  };

  const handleMetallicToggle = (type: 'pantyhose' | 'stockings' | 'leggings' | 'socks', checked: boolean) => {
    handlePersonStateChange(activePersonIndex, `${type}Metallic`, checked);
    
    const person = promptState.people[activePersonIndex];
    const modesRef = type === 'pantyhose' ? pantyhoseModesRef : type === 'stockings' ? stockingsModesRef : type === 'leggings' ? leggingsModesRef : socksModesRef;
    const colorsRef = type === 'pantyhose' ? pantyhoseColorsRef : type === 'stockings' ? stockingsModesRef : type === 'leggings' ? leggingsColorsRef : socksColorsRef;

    const mode = modesRef.current[person.id];
    if (mode) {
        const color = colorsRef.current[person.id];
        const length = type === 'stockings' ? person.stockingLength : (type === 'socks' ? person.sockLength : undefined);
        const newValue = getLegwearValue(mode, color, length, checked);
        handlePersonStateChange(activePersonIndex, type, newValue);
    }
  };

  const processAndValidateFile = async (file: File): Promise<UploadedImageState | null> => {
    setAnalysisError('');
    try {
        const originalData = await readFileAsDataUrl(file);
        
        const API_SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        const CONVERTABLE_MIME_TYPES = ['image/gif', 'image/bmp', 'image/avif'];

        addLog(t('controlPanel.logs.fileValidation', language, originalData.mimeType, file.name));

        if (API_SUPPORTED_MIME_TYPES.includes(originalData.mimeType)) {
            return { file, base64: originalData.base64, mimeType: originalData.mimeType, previewUrl: originalData.dataUrl };
        }

        if (CONVERTABLE_MIME_TYPES.includes(originalData.mimeType)) {
            addLog(t('controlPanel.logs.fileConversion', language, originalData.mimeType));
            
            return await new Promise<UploadedImageState>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(new Error(t('controlPanel.logs.fileConversionErrorCanvas', language)));
                    }
                    ctx.drawImage(img, 0, 0);
                    
                    const dataUrl = canvas.toDataURL('image/png');
                    const mimeType = 'image/png';
                    const base64 = dataUrl.split(',')[1];
                    
                    addLog(t('controlPanel.logs.fileConversionSuccess', language, file.name));
                    resolve({ file, base64, mimeType, previewUrl: dataUrl });
                };
                img.onerror = () => {
                    reject(new Error(t('controlPanel.logs.fileConversionErrorLoad', language, file.name)));
                };
                img.src = originalData.dataUrl;
            });
        }
        
        const errorMessage = t('controlPanel.logs.unsupportedFile', language, originalData.mimeType);
        addLog(errorMessage);
        setAnalysisError(errorMessage);
        return null;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLog(errorMessage);
        setAnalysisError(errorMessage);
        return null;
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleStateChange = useCallback(<K extends keyof PromptState>(key: K, value: PromptState[K]) => {
    setPromptState(prevState => {
        const newState: PromptState = { ...prevState };
        (newState as any)[key] = value;
        
        if (key === 'numberOfPeople' && prevState.customSubject) {
            newState.customSubject = '';
            addLog(t('controlPanel.logs.subjectChanged', language));
        }
        return newState;
    });
  }, [setPromptState, addLog, language]);

  const handlePersonStateChange = useCallback(<K extends keyof PersonState>(personIndex: number, key: K, value: PersonState[K]) => {
    setPromptState(prevState => {
        const newPeople = prevState.people.map((person, index) => {
            if (index === personIndex) {
                const updatedPerson = { ...person };
                updatedPerson[key] = value;
                
                const outfitPieceKeys: (keyof PersonState)[] = [
                    'pantyhose', 'stockings', 'leggings', 'socks',
                    'shoe', 'shoeQuick', 'hat', 'glasses', 'earrings',
                    'necklace', 'bag', 'weapon'
                ];

                if (key !== 'customOutfit' && outfitPieceKeys.includes(key as any)) {
                    if (updatedPerson.customOutfit) {
                        addLog(t('controlPanel.logs.customOutfitCleared', language));
                    }
                    updatedPerson.customOutfit = '';
                }
                
                return updatedPerson;
            }
            return person;
        });

        const newState = { ...prevState, people: newPeople };
        
        if (prevState.customSubject) {
            newState.customSubject = '';
            addLog(t('controlPanel.logs.subjectReset', language));
        }
        return newState;
    });
  }, [setPromptState, addLog, language]);

  const handleFixedPromptToggle = (key: string) => {
    setPromptState(prevState => {
        const currentFixed = prevState.fixedPrompts || [];
        const newFixed = currentFixed.includes(key)
            ? currentFixed.filter(k => k !== key)
            : [...currentFixed, key];
        return { ...prevState, fixedPrompts: newFixed };
    });
  };

  const handleHourglassToggle = () => {
    const activePerson = promptState.people[activePersonIndex];
    if (activePerson) {
        handlePersonStateChange(activePersonIndex, 'hasHourglassWaist', !activePerson.hasHourglassWaist);
    }
  };

  const handleRippedToggle = () => {
    const activePerson = promptState.people[activePersonIndex];
    if (activePerson) {
        handlePersonStateChange(activePersonIndex, 'hasRippedBody', !activePerson.hasRippedBody);
    }
  };

  const generateEditPromptFromState = useCallback(() => {
    const person = promptState.people[activePersonIndex] || promptState.people[0];
    if (!person) return '';

    const mainLegwear = person.pantyhose || person.stockings || person.leggings;
    let legwearDescription = mainLegwear;
    if (person.socks) {
        if (mainLegwear) {
            legwearDescription = `${mainLegwear}, with ${person.socks} over them`;
        } else {
            legwearDescription = person.socks;
        }
    }
    
    const outfitDesc = person.customOutfit || '';
    const resolvedShoe = person.shoe || (person.shoeQuick === 'auto' ? suggestShoes(outfitDesc, mainLegwear) : (person.shoeQuick === 'random' ? any(SHOES.map(s => s.v).filter(s => s !== 'auto' && s !== 'random')) : (person.shoeQuick || '')));

    const outfitDescription = [outfitDesc, legwearDescription, resolvedShoe].filter(Boolean);
    
    const modifications: string[] = getUiModifications(person, promptState);
    
    if (outfitDescription.length > 0 && !uploadedImageData2) {
        modifications.unshift(`Outfit: ${outfitDescription.join(', ')}`);
    }

    const modificationPrompt = modifications.length > 0 ? ` Also apply the following modifications to the subject: ${modifications.join('. ')}.` : '';

    if (uploadedImageData2) {
        const basePrompt = "Redraw the subject from the first image to be wearing the outfit shown in the second image. The subject's appearance, pose, and the background should remain the same as the first image, but their clothing should be replaced. The style of the final image should match the first image.";
        return `${basePrompt}${modificationPrompt}`;
    }

    if (modifications.length > 0) {
        return `Modify the image. ${modifications.join('. ')}.`;
    }

    return t('controlPanel.placeholders.editPrompt', language);
  }, [promptState, activePersonIndex, uploadedImageData2, language]);

   useEffect(() => {
    if (activeVisionFeature === 'edit' && !isEditPromptDirty) {
      const newPrompt = generateEditPromptFromState();
      setEditPrompt(newPrompt);
    }
  }, [activeVisionFeature, isEditPromptDirty, generateEditPromptFromState, setEditPrompt, promptState, uploadedImageData2]);
  
  const handlePresetSelect = useCallback((personIndex: number, preset: Preset) => {
      const randomGenerators: {[key: string]: () => string} = {
          "__random_school_uniform__": generateRandomSchoolUniform,
          "__random_semi_formal__": generateRandomSemiFormalOutfit,
          "__random_classic_suit__": generateRandomClassicSuit,
          "__random_hanbok__": generateRandomHanbokOutfit,
          "__random_denim__": generateRandomDenimOutfit,
          "__random_tennis__": generateRandomTennisOutfit,
          "__random_kpop__": generateRandomKpopOutfit,
          "__random_traditional_hanbok__": generateRandomTraditionalHanbok,
          "__random_kimono__": generateRandomKimonoOutfit,
          "__random_traditional_kimono__": generateRandomTraditionalKimonoOutfit,
          "__random_qipao__": generateRandomQipaoOutfit,
          "__random_traditional_qipao__": generateRandomTraditionalQipaoOutfit,
          "__random_ao_dai__": generateRandomAoDaiOutfit,
          "__random_traditional_ao_dai__": generateRandomTraditionalAoDaiOutfit,
          "__random_sari__": generateRandomSariOutfit,
          "__random_traditional_sari__": generateRandomTraditionalSariOutfit,
          "__random_chut_thai__": generateRandomChutThaiOutfit,
          "__random_traditional_chut_thai__": generateRandomTraditionalChutThaiOutfit,
          "__random_kebaya__": generateRandomKebayaOutfit,
          "__random_traditional_kebaya__": generateRandomTraditionalKebayaOutfit,
          "__random_longyi__": generateRandomLongyiOutfit,
          "__random_traditional_longyi__": generateRandomTraditionalLongyiOutfit,
          "__random_deel__": generateRandomDeelOutfit,
          "__random_traditional_deel__": generateRandomTraditionalDeelOutfit,
          "__random_kaftan__": generateRandomKaftanOutfit,
          "__random_traditional_kaftan__": generateRandomTraditionalKaftanOutfit,
          "__random_tunic__": generateRandomTunicOutfit,
          "__random_traditional_tunic__": generateRandomTraditionalTunicOutfit,
          "__random_toga__": generateRandomTogaOutfit,
          "__random_traditional_toga__": generateRandomTraditionalTogaOutfit,
          "__random_flamenco__": generateRandomFlamencoOutfit,
          "__random_traditional_flamenco__": generateRandomTraditionalFlamencoOutfit,
          "__random_kilt__": generateRandomKiltOutfit,
          "__random_traditional_kilt__": generateRandomTraditionalKiltOutfit,
          "__random_dirndl__": generateRandomDirndlOutfit,
          "__random_traditional_dirndl__": generateRandomTraditionalDirndlOutfit,
          "__random_klederdracht__": generateRandomKlederdrachtOutfit,
          "__random_traditional_klederdracht__": generateRandomTraditionalKlederdrachtOutfit,
          "__random_sarafan__": generateRandomSarafanOutfit,
          "__random_traditional_sarafan__": generateRandomTraditionalSarafanOutfit,
          "__random_vyshyvanka__": generateRandomVyshyvankaOutfit,
          "__random_traditional_vyshyvanka__": generateRandomTraditionalVyshyvankaOutfit,
          "__random_kontusz__": generateRandomKontuszOutfit,
          "__random_traditional_kontusz__": generateRandomTraditionalKontuszOutfit,
          "__random_bunad__": generateRandomBunadOutfit,
          "__random_traditional_bunad__": generateRandomTraditionalBunadOutfit,
          "__random_folkdrakt_se__": generateRandomFolkdraktSEOutfit,
          "__random_traditional_folkdrakt_se__": generateRandomTraditionalFolkdraktSEOutfit,
          "__random_folkedragt_dk__": generateRandomFolkedragtDKOutfit,
          "__random_traditional_folkedragt_dk__": generateRandomTraditionalFolkedragtDKOutfit,
          "__random_kansallispuku__": generateRandomKansallispukuOutfit,
          "__random_traditional_kansallispuku__": generateRandomTraditionalKansallispukuOutfit,
          "__random_parisian__": generateRandomParisianOutfit,
          "__random_dandy__": generateRandomDandyOutfit,
          "__random_lederhosen__": generateRandomLederhosenOutfit,
          "__random_baseball_uniform__": generateRandomBaseballOutfit,
          "__random_soccer_uniform__": generateRandomSoccerOutfit,
          "__random_basketball_uniform__": generateRandomBasketballOutfit,
          "__random_volleyball_uniform__": generateRandomVolleyballOutfit,
          "__random_golf_outfit__": generateRandomGolfOutfit,
          "__random_prowrestling_outfit__": generateRandomProWrestlingOutfit,
          "__random_icehockey_uniform__": generateRandomIceHockeyOutfit,
          "__random_americanfootball_uniform__": generateRandomAmericanFootballOutfit,
          "__random_fieldhockey_uniform__": generateRandomFieldHockeyOutfit,
          "__random_lacrosse_uniform__": generateRandomLacrosseOutfit,
          "__random_bowling_outfit__": generateRandomBowlingOutfit,
          "__random_trackandfield_outfit__": generateRandomTrackAndFieldOutfit,
          "__random_boxing_outfit__": generateRandomBoxingOutfit,
          "__random_fencing_outfit__": generateRandomFencingOutfit,
          "__random_archery_outfit__": generateRandomArcheryOutfit,
          "__random_pilates_outfit__": generateRandomPilatesOutfit,
          "__random_rhythmic_gymnastics_leotard__": generateRandomRhythmicGymnasticsLeotard,
          "__random_ballroom_gown__": generateRandomBallroomGown,
          "__random_latin_dance_dress__": generateRandomLatinDanceDress,
          "__random_tap_dance_outfit__": generateRandomTapDanceOutfit,
          "__random_jazz_dance_outfit__": generateRandomJazzDanceOutfit,
          "__random_hiphop_dance_outfit__": generateRandomHiphopDanceOutfit,
          "__random_modern_dance_outfit__": generateRandomModernDanceOutfit,
          "__random_salsa_dress__": generateRandomSalsaDress,
          "__random_tango_dress__": generateRandomTangoDress,
          "__random_marathon_outfit__": generateRandomMarathonOutfit,
          "__random_table_tennis_uniform__": generateRandomTableTennisUniform,
          "__random_badminton_uniform__": generateRandomBadmintonUniform,
          "__random_cosplay_street_fighter__": generateRandomCosplayStreetFighter,
          "__random_cosplay_tekken__": generateRandomCosplayTekken,
          "__random_cosplay_kof__": generateRandomCosplayKOF,
          "__random_cosplay_sailor_moon__": generateRandomCosplaySailorMoon,
          "__random_cosplay_dragon_ball__": generateRandomCosplayDragonBall,
          "__random_cosplay_demon_slayer__": generateRandomCosplayDemonSlayer,
          "__random_cosplay_tokyo_revengers__": generateRandomCosplayTokyoRevengers,
          "__random_cosplay_genshin_impact__": generateRandomCosplayGenshinImpact,
          "__random_knight_cosplay__": generateRandomKnightCosplay,
          "__random_modern_maid__": generateRandomModernMaidOutfit,
          "__random_chef_uniform__": generateRandomChefUniform,
          "__random_nun_traditional__": generateRandomTraditionalNunOutfit,
          "__random_nun_modern__": generateRandomModernNunOutfit,
          "__random_nurse_traditional__": generateRandomTraditionalNurseOutfit,
          "__random_nurse_modern__": generateRandomModernNurseOutfit,
          "__random_doll_style_dress__": generateRandomDollStyleDressOutfit,
          "__random_gothic_doll_dress__": generateRandomGothicDollDressOutfit,
      };

      const applyOutfit = (outfit: string, message: string) => {
        setPromptState(prevState => {
            const newPeople = [...prevState.people];
            if (!newPeople[personIndex]) return prevState;
            const updatedPerson = { ...newPeople[personIndex], customOutfit: outfit };
            newPeople[personIndex] = updatedPerson;
            return { ...prevState, people: newPeople };
        });
        addLog(message);
      };

      const presetLabel = t(preset.label, language);
      if (randomGenerators[preset.outfit]) {
          const finalOutfit = randomGenerators[preset.outfit]();
          const logMessage = t('controlPanel.logs.presetAppliedRandom', language, presetLabel, finalOutfit);
          applyOutfit(finalOutfit, logMessage);
      } else if (preset.outfit.startsWith('__random_color__')) {
          const randomColor = any(COLORS_ARR);
          const finalOutfit = preset.outfit.replace('__random_color__', randomColor);
          const logMessage = t('controlPanel.logs.colorized', language, presetLabel, finalOutfit);
          applyOutfit(finalOutfit, logMessage);
      } else {
          applyOutfit(preset.outfit, t('controlPanel.logs.presetApplied', language, presetLabel));
      }
  }, [setPromptState, addLog, language, t]);

    const groupedAndFilteredPresets = useMemo<Record<string, Preset[]>>(() => {
        const searchFiltered = presets.filter(p =>
            t(p.label, language).toLowerCase().includes(presetSearch.toLowerCase())
        );

        const categoryFiltered = selectedCategory === 'all'
            ? searchFiltered
            : searchFiltered.filter(p => p.cat === selectedCategory);

        return categoryFiltered.reduce((acc: Record<string, Preset[]>, preset: Preset) => {
            const category = preset.cat;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(preset);
            return acc;
        }, {} as Record<string, Preset[]>);
    }, [presets, selectedCategory, presetSearch, language, t]);

    const presetCategories = useMemo(() => ['all', ...Array.from(new Set(presets.map(p => p.cat)))], [presets]);

    const activePerson = promptState.people[activePersonIndex] || promptState.people[0];
    
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageSlot: 1 | 2) => {
        const file = e.target.files?.[0];
        if (file) {
            const validatedData = await processAndValidateFile(file);
            if (validatedData) {
                const setter = imageSlot === 1 ? setUploadedImageData1 : setUploadedImageData2;
                setter(validatedData);
                addLog(t('controlPanel.logs.imageLoaded', language, imageSlot, file.name));
            }
        }
        if (e.target) e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        e.preventDefault();
        e.stopPropagation();
        setter(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        e.preventDefault();
        e.stopPropagation();
        setter(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, imageSlot: 1 | 2) => {
        e.preventDefault();
        e.stopPropagation();
        const setter = imageSlot === 1 ? setIsDragging1 : setIsDragging2;
        setter(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const validatedData = await processAndValidateFile(file);
            if (validatedData) {
                const dataSetter = imageSlot === 1 ? setUploadedImageData1 : setUploadedImageData2;
                dataSetter(validatedData);
                addLog(t('controlPanel.logs.imageDropped', language, imageSlot, file.name));
            }
        }
    };
    
    const handleBgFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingBg(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setIsProcessingBg(true);
            addLog(t('controlPanel.logs.bgImageProcessing', language, file.name));
            const validatedData = await processAndValidateFile(file);
            if (validatedData) {
                setPendingBgImage({ base64: validatedData.base64, mimeType: validatedData.mimeType, previewUrl: validatedData.previewUrl });
            }
            setIsProcessingBg(false);
        }
    };

    const handleBgFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingBg(true);
            addLog(t('controlPanel.logs.bgImageReading', language, file.name));
            const validatedData = await processAndValidateFile(file);
            if (validatedData) {
                setPendingBgImage({ base64: validatedData.base64, mimeType: validatedData.mimeType, previewUrl: validatedData.previewUrl });
            }
            setIsProcessingBg(false);
        }
        if (e.target) e.target.value = '';
    };

    const handleConfirmBackground = async () => {
        if (pendingBgImage) {
            setIsProcessingBg(true);
            addLog(t('controlPanel.logs.bgImageAnalyzing', language));
            try {
                const backgroundDescription = await analyzeBackgroundImage(pendingBgImage.base64, pendingBgImage.mimeType, language);
                setPromptState(p => ({ ...p, background: backgroundDescription }));
                addLog(t('controlPanel.logs.bgImageSet', language, backgroundDescription));
            } catch (error) {
                 const errorMessage = error instanceof Error ? error.message : String(error);
                addLog(t('controlPanel.logs.bgAnalysisError', language, errorMessage));
            } finally {
                setPendingBgImage(null);
                setDirectBackgroundImage(null);
                setIsProcessingBg(false);
            }
        }
    };

    const handleUseBackgroundDirectly = () => {
        if (pendingBgImage) {
            setDirectBackgroundImage(pendingBgImage);
            addLog(t('controlPanel.logs.bgImageDirect', language));
            setPendingBgImage(null);
            setPromptState(p => ({ ...p, background: '' }));
        }
    };
    
    const handlePoseFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingPose(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            await processPoseFile(file);
        }
    };

    const handlePoseFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await processPoseFile(file);
        }
        if (e.target) e.target.value = '';
    };

    const processPoseFile = async (file: File) => {
        setPoseImageFile(file);
        setIsAnalyzingPose(true);
        addLog(t('controlPanel.logs.poseAnalyzing', language, file.name));
        
        const validatedData = await processAndValidateFile(file);
        
        if (!validatedData) {
            setIsAnalyzingPose(false);
            return;
        }
    
        try {
            const { base64, mimeType, previewUrl } = validatedData;
            setPoseImagePreview(previewUrl);
            const poseDescription = await analyzePoseAndAction(base64, mimeType, language);
            setPromptState(p => ({...p, pose: poseDescription}));
            addLog(t('controlPanel.logs.poseSet', language, poseDescription));
        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            addLog(t('controlPanel.logs.poseAnalysisError', language, errorMessage));
            setAnalysisError(errorMessage);
        } finally {
            setIsAnalyzingPose(false);
        }
    };

    const handleExecuteEdit = async () => {
        if (!uploadedImageData1) {
            addLog(t('controlPanel.logs.editImageMissing', language));
            return;
        }
    
        if (uploadedImageData2) {
            if (isEditPromptDirty) {
                addLog(t('controlPanel.logs.manualEditDetected', language));
                onEditImage([uploadedImageData1, uploadedImageData2], editPrompt);
                return;
            }
    
            setIsAnalyzingSourceOutfit(true);
            try {
                addLog(t('controlPanel.logs.sourceOutfitAnalyzing', language, uploadedImageData2.file.name));
                const analysisResult = await performGeminiAnalysis(uploadedImageData2.base64, uploadedImageData2.mimeType, language);
                const outfitDescription = analysisResult.outfit;
    
                if (!outfitDescription) {
                    throw new Error(t('controlPanel.logs.outfitNotIdentified', language));
                }
                addLog(t('controlPanel.logs.outfitIdentified', language, outfitDescription));
    
                const person = promptState.people[activePersonIndex] || promptState.people[0];
                const modifications: string[] = getUiModifications(person, promptState);
                
                const modificationPrompt = modifications.length > 0 ? ` In addition, apply the following modifications: ${modifications.join('. ')}.` : '';
    
                const finalPrompt = `Redraw the subject to be wearing the following outfit: "${outfitDescription}". The original subject's appearance (face, body shape), pose, and background should be preserved. The style of the final image should also match the original.${modificationPrompt}`;
                addLog(t('controlPanel.logs.applyingToOriginal', language, finalPrompt));
                
                onEditImage([uploadedImageData1], finalPrompt);
    
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                addLog(t('controlPanel.logs.sourceAnalysisFailed', language, errorMessage));
                setAnalysisError(errorMessage);
            } finally {
                setIsAnalyzingSourceOutfit(false);
            }
        } else {
            onEditImage([uploadedImageData1], editPrompt);
        }
      };

    const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validatedData = await processAndValidateFile(file);
            if (validatedData) {
                setVideoSourceImage(validatedData);
                addLog(t('controlPanel.logs.videoSourceLoaded', language, file.name));
            }
        }
        if (e.target) e.target.value = '';
    };

    const handleVideoDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingVideo(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const validatedData = await processAndValidateFile(file);
            if (validatedData) {
                setVideoSourceImage(validatedData);
                addLog(t('controlPanel.logs.videoSourceDropped', language, file.name));
            }
        }
    };
    
    const handleRandomColorPantyhose = () => {
        const modeToUse = pantyhoseModesRef.current[activePerson.id] || 'random-pantyhose';
        const color = any(COLORS_ARR);
        pantyhoseColorsRef.current[activePerson.id] = color;
        const generated = getLegwearValue(modeToUse, color, undefined, activePerson.pantyhoseMetallic);
    
        handlePersonStateChange(activePersonIndex, 'pantyhose', generated);
        addLog(t('controlPanel.logs.pantyhoseSet', language, generated));
    };

    const handleSelectColorPantyhose = (hexColor: string) => {
        const colorName = hexToColorName(hexColor);
        pantyhoseColorsRef.current[activePerson.id] = colorName;
        const modeToUse = pantyhoseModesRef.current[activePerson.id] || 'random-pantyhose';
        const generated = getLegwearValue(modeToUse, colorName, undefined, activePerson.pantyhoseMetallic);
        
        handlePersonStateChange(activePersonIndex, 'pantyhose', generated);
        addLog(t('controlPanel.logs.pantyhoseSet', language, generated));
        setShowPantyhoseColorPicker(false);
    };

    const handleRandomColorLeggings = () => {
        const modeToUse = leggingsModesRef.current[activePerson.id] || 'random-leggings';
        const color = any(COLORS_ARR);
        leggingsColorsRef.current[activePerson.id] = color;
        const generated = getLegwearValue(modeToUse, color, undefined, activePerson.leggingsMetallic);

        handlePersonStateChange(activePersonIndex, 'leggings', generated);
        addLog(t('controlPanel.logs.leggingsSet', language, generated));
    };

    const handleSelectColorLeggings = (hexColor: string) => {
        const colorName = hexToColorName(hexColor);
        leggingsColorsRef.current[activePerson.id] = colorName;
        const modeToUse = leggingsModesRef.current[activePerson.id] || 'random-leggings';
        const generated = getLegwearValue(modeToUse, colorName, undefined, activePerson.leggingsMetallic);
        
        handlePersonStateChange(activePersonIndex, 'leggings', generated);
        addLog(t('controlPanel.logs.leggingsSet', language, generated));
        setShowLeggingsColorPicker(false);
    };

    const handleRandomColorStockings = () => {
        const modeToUse = stockingsModesRef.current[activePerson.id] || 'random-stockings';
        const color = any(COLORS_ARR);
        stockingsColorsRef.current[activePerson.id] = color;
        const generated = getLegwearValue(modeToUse, color, activePerson.stockingLength, activePerson.stockingsMetallic);
        
        handlePersonStateChange(activePersonIndex, 'stockings', generated);
        addLog(t('controlPanel.logs.stockingsSet', language, generated));
    };

    const handleSelectColorStockings = (hexColor: string) => {
        const colorName = hexToColorName(hexColor);
        stockingsColorsRef.current[activePerson.id] = colorName;
        const modeToUse = stockingsModesRef.current[activePerson.id] || 'random-stockings';
        const generated = getLegwearValue(modeToUse, colorName, activePerson.stockingLength, activePerson.stockingsMetallic);
        
        handlePersonStateChange(activePersonIndex, 'stockings', generated);
        addLog(t('controlPanel.logs.stockingsSet', language, generated));
        setShowStockingsColorPicker(false);
    };
    
    const handleStockingLengthChange = (newLength: string) => {
        handlePersonStateChange(activePersonIndex, 'stockingLength', newLength);
    
        const person = activePerson;
        const modeToUse = stockingsModesRef.current[person.id];
        const colorToUse = stockingsColorsRef.current[person.id];
    
        if (modeToUse) {
            const newStockingsValue = getLegwearValue(modeToUse, colorToUse, newLength, activePerson.stockingsMetallic);
            handlePersonStateChange(activePersonIndex, 'stockings', newStockingsValue);
            
            const lengthOption = STOCKING_LENGTH_OPTIONS.find(o => o.v === newLength);
            const translatedLength = lengthOption ? t(lengthOption.t, language) : newLength;

            addLog(t('controlPanel.logs.stockingLengthSet', language, translatedLength, newStockingsValue));
        }
    };

    const handleRandomColorSocks = () => {
        const modeToUse = socksModesRef.current[activePerson.id] || 'random-socks';
        const color = any(COLORS_ARR);
        socksColorsRef.current[activePerson.id] = color;
        const generated = getLegwearValue(modeToUse, color, activePerson.sockLength, activePerson.socksMetallic);
        
        handlePersonStateChange(activePersonIndex, 'socks', generated);
        addLog(t('controlPanel.logs.socksSet', language, generated));
    };

    const handleSelectColorSocks = (hexColor: string) => {
        const colorName = hexToColorName(hexColor);
        socksColorsRef.current[activePerson.id] = colorName;
        const modeToUse = socksModesRef.current[activePerson.id] || 'random-socks';
        const generated = getLegwearValue(modeToUse, colorName, activePerson.sockLength, activePerson.socksMetallic);

        handlePersonStateChange(activePersonIndex, 'socks', generated);
        addLog(t('controlPanel.logs.socksSet', language, generated));
        setShowSocksColorPicker(false);
    };
    
    const handleSockLengthChange = (newLength: string) => {
        handlePersonStateChange(activePersonIndex, 'sockLength', newLength);
    
        const person = activePerson;
        const modeToUse = socksModesRef.current[person.id];
        const colorToUse = socksColorsRef.current[person.id];
    
        if (modeToUse) {
            const newSocksValue = getLegwearValue(modeToUse, colorToUse, newLength, activePerson.socksMetallic);
            handlePersonStateChange(activePersonIndex, 'socks', newSocksValue);

            const lengthOption = SOCK_LENGTH_OPTIONS.find(o => o.v === newLength);
            const translatedLength = lengthOption ? t(lengthOption.t, language) : newLength;

            addLog(t('controlPanel.logs.sockLengthSet', language, translatedLength, newSocksValue));
        }
    };

    const handleCreateVideoPrompt = async () => {
        if (!videoIdeaInput) return;
        addLog(t('controlPanel.logs.videoPromptCreating', language));
        setIsCreatingVideoPrompt(true);
        try {
            const detailedPrompt = await createVideoPromptFromIdea(videoIdeaInput, language);
            setVideoGenPrompt(detailedPrompt);
            setActiveVisionFeature('video');
            addLog(t('controlPanel.logs.videoPromptCreated', language));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            addLog(t('controlPanel.logs.videoPromptCreateError', language, errorMessage));
        } finally {
            setIsCreatingVideoPrompt(false);
        }
    };

    const handleAtmosphereChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAtmosphere = e.target.value;
        handleStateChange('atmosphere', newAtmosphere);
    
        // If a specific atmosphere is selected (not the 'None' option)
        if (newAtmosphere) {
            const atmosphereOption = ATMOSPHERE_OPTIONS.find(o => o.v === newAtmosphere);
            const translatedAtmosphere = atmosphereOption ? t(atmosphereOption.t, language) : newAtmosphere;
            addLog(t('controlPanel.logs.atmosphereGenerating', language, translatedAtmosphere));
            setIsGeneratingAtmosphere(true);
            try {
                const backgroundDescription = await generateBackgroundFromAtmosphere(newAtmosphere, language);
                handleStateChange('background', backgroundDescription);
                addLog(t('controlPanel.logs.atmosphereSet', language, backgroundDescription));
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                addLog(t('controlPanel.logs.atmosphereError', language, message));
            } finally {
                setIsGeneratingAtmosphere(false);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
            setShowPantyhoseColorPicker(false);
          }
          if (leggingsColorPickerRef.current && !leggingsColorPickerRef.current.contains(event.target as Node)) {
            setShowLeggingsColorPicker(false);
          }
          if (stockingsColorPickerRef.current && !stockingsColorPickerRef.current.contains(event.target as Node)) {
            setShowStockingsColorPicker(false);
          }
          if (socksColorPickerRef.current && !socksColorPickerRef.current.contains(event.target as Node)) {
            setShowSocksColorPicker(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const renderSelect = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {v: string, t: string}[], disabled = false) => (
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
            <select value={value} onChange={onChange} disabled={disabled} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {options.map(opt => <option key={opt.v} value={opt.v}>{t(opt.t, language)}</option>)}
            </select>
        </div>
    );
    
    const renderHairStyleSelect = () => (
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t('controlPanel.labels.hairStyle', language)}</label>
            <select
                value={activePerson.hairStyle}
                onChange={e => handlePersonStateChange(activePersonIndex, 'hairStyle', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
            >
                {HAIR_STYLE_OPTIONS.map(opt => {
                    const isCompatible = !LENGTH_INCOMPATIBLE_HAIRSTYLES.has(opt.v);
                    return (
                        <option
                            key={opt.v}
                            value={opt.v}
                            style={{ color: isCompatible ? '#F472B6' : 'inherit' }}
                        >
                            {t(opt.t, language)}
                        </option>
                    );
                })}
            </select>
        </div>
    );

    const renderTextInput = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string) => (
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
            <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
        </div>
    );

    const renderDropZone = (
        id: string,
        isDragging: boolean,
        handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void,
        handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void,
        handleDrop: (e: React.DragEvent<HTMLDivElement>) => void,
        fileInputRef: React.RefObject<HTMLInputElement>,
        handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
        uploadedImage: UploadedImageState | null,
        label: string,
        onClear: () => void
    ) => (
         <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploadedImage && fileInputRef.current?.click()}
            className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors flex items-center justify-center min-h-[152px] ${isDragging ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-600 hover:border-slate-500'} ${!uploadedImage ? 'cursor-pointer' : ''}`}
        >
            <input type="file" id={id} ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
            {uploadedImage ? (
                <div className="relative inline-block">
                    <img src={uploadedImage.previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-md" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClear(); }} 
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs leading-none z-10"
                        aria-label="Remove image"
                        title="Remove image"
                    >
                        &times;
                    </button>
                </div>
            ) : (
                <span className="text-xs text-slate-400">{label}</span>
            )}
        </div>
    );

  return (
    <aside className="bg-black/20 backdrop-blur-sm border border-fuchsia-500/20 rounded-lg p-4 flex flex-col gap-1">
      {!activePerson ? (
        <div className="text-red-500 p-4">{t('controlPanel.error', language)}</div>
      ) : (
        <>
            <Section title={t('controlPanel.sections.camera', language)}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {renderSelect(t('controlPanel.labels.aspectRatio', language), promptState.aspect, e => handleStateChange('aspect', e.target.value), ASPECT_RATIOS)}
                    {renderTextInput(t('controlPanel.labels.customAR', language), promptState.customAR, e => handleStateChange('customAR', e.target.value), t('controlPanel.placeholders.customAR', language))}
                    {renderSelect(t('controlPanel.labels.cameraBody', language), promptState.cameraBody, e => handleStateChange('cameraBody', e.target.value), CAMERA_BODIES)}
                    {renderSelect(t('controlPanel.labels.lens', language), promptState.lensSelect, e => handleStateChange('lensSelect', e.target.value), LENSES)}
                    {renderSelect(t('controlPanel.labels.whiteBalance', language), promptState.wb, e => handleStateChange('wb', e.target.value), WB_OPTIONS)}
                    {renderTextInput(t('controlPanel.labels.exposure', language), promptState.exposure, e => handleStateChange('exposure', e.target.value), t('controlPanel.placeholders.exposure', language))}
                    {renderSelect(t('controlPanel.labels.composition', language), promptState.cameraComposition, e => handleStateChange('cameraComposition', e.target.value), CAMERA_COMPOSITION_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.eraStyle', language), promptState.eraSelect, e => handleStateChange('eraSelect', e.target.value), ERA_OPTIONS)}
                </div>
            </Section>

            <Section title={t('controlPanel.sections.subject', language)}>
                <div className="flex flex-col gap-3">
                    {renderSelect(t('controlPanel.labels.numPeople', language), promptState.numberOfPeople, e => handleStateChange('numberOfPeople', e.target.value), NUMBER_OF_PEOPLE_OPTIONS)}
                    <div className="flex border-b border-slate-700">
                        {promptState.people.map((person, index) => (
                             <button key={person.id} onClick={() => setActivePersonIndex(index)} className={`px-4 py-2 text-sm font-medium transition-colors ${activePersonIndex === index ? 'border-b-2 border-fuchsia-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                                {t('controlPanel.tabs.person', language, index + 1)}
                            </button>
                        ))}
                    </div>
                     <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="col-span-2 lg:col-span-1">
                            {renderSelect(t('controlPanel.labels.age', language), activePerson.ageSelect, e => handlePersonStateChange(activePersonIndex, 'ageSelect', e.target.value), AGE_OPTIONS)}
                        </div>
                        <div className="col-span-2 lg:col-span-2 grid grid-cols-2 gap-3">
                            {renderSelect(t('controlPanel.labels.character', language), activePerson.characterSelect, e => handlePersonStateChange(activePersonIndex, 'characterSelect', e.target.value), CHARACTER_OPTIONS)}
                            {renderSelect(`${t('controlPanel.labels.character', language)} 2`, activePerson.characterSelect2, e => handlePersonStateChange(activePersonIndex, 'characterSelect2', e.target.value), [{v:'', t:'options.character.none'}, ...CHARACTER_OPTIONS.slice(1)])}
                        </div>
                         {renderHairStyleSelect()}
                         {renderSelect(t('controlPanel.labels.hairColor', language), activePerson.hairColor, e => handlePersonStateChange(activePersonIndex, 'hairColor', e.target.value), HAIR_COLOR_OPTIONS)}
                         {renderSelect(t('controlPanel.labels.hairLength', language), activePerson.hairLength, e => handlePersonStateChange(activePersonIndex, 'hairLength', e.target.value), HAIR_LENGTH_OPTIONS, LENGTH_INCOMPATIBLE_HAIRSTYLES.has(activePerson.hairStyle))}
                         {renderSelect(t('controlPanel.labels.windEffect', language), activePerson.hairWind, e => handlePersonStateChange(activePersonIndex, 'hairWind', e.target.value), hairWindOptions)}
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id={`curvyBody-${activePerson.id}`} checked={activePerson.hasCurvyFigure} onChange={e => handlePersonStateChange(activePersonIndex, 'hasCurvyFigure', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                            <label htmlFor={`curvyBody-${activePerson.id}`} className="text-sm text-slate-300">{t('controlPanel.buttons.curvyBody', language)}</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id={`allowPants-${activePerson.id}`} checked={activePerson.allowPants} onChange={e => handlePersonStateChange(activePersonIndex, 'allowPants', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                            <label htmlFor={`allowPants-${activePerson.id}`} className="text-sm text-slate-300">{t('controlPanel.buttons.allowPants', language)}</label>
                        </div>
                    </div>
                    <textarea value={promptState.customSubject} onChange={e => handleStateChange('customSubject', e.target.value)} placeholder={t('controlPanel.placeholders.customSubject', language)} rows={2} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                </div>
            </Section>

            <Section title={t('controlPanel.sections.outfit', language)}>
                 <textarea value={activePerson.customOutfit} onChange={e => handlePersonStateChange(activePersonIndex, 'customOutfit', e.target.value)} placeholder={t('controlPanel.placeholders.customOutfit', language)} rows={3} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 font-mono" />
            </Section>
            
            <Section title={t('controlPanel.sections.presets', language)}>
                <div className="flex gap-4 mb-2 items-center">
                    <div className="flex-grow flex gap-2">
                        <input type="search" value={presetSearch} onChange={e => setPresetSearch(e.target.value)} placeholder={t('controlPanel.placeholders.presetSearch', language)} className="flex-grow bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500">
                            {presetCategories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? t('options.presets.allCategories', language) : t(cat, language)}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id={`metallicOutfit-${activePerson.id}`} 
                                checked={activePerson.metallicOutfit} 
                                onChange={(e) => handlePersonStateChange(activePersonIndex, 'metallicOutfit', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" 
                            />
                            <label htmlFor={`metallicOutfit-${activePerson.id}`} className="text-sm text-slate-300 whitespace-nowrap">{t('controlPanel.labels.metallic', language)}</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id={`noOutfit-${activePerson.id}`} 
                                checked={!activePerson.customOutfit} 
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        handlePersonStateChange(activePersonIndex, 'customOutfit', '');
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" 
                            />
                            <label htmlFor={`noOutfit-${activePerson.id}`} className="text-sm text-slate-300 whitespace-nowrap">{t('controlPanel.labels.noOutfit', language)}</label>
                        </div>
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {Object.entries(groupedAndFilteredPresets).map(([category, presetsInCategory]) => (
                        <div key={category}>
                             <h4 onClick={() => toggleCategory(category)} className="text-xs font-bold text-fuchsia-400 uppercase mb-1 cursor-pointer select-none">{t(category, language)} {collapsedCategories[category] ? '▼' : '▲'}</h4>
                             {!collapsedCategories[category] && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                                    {(presetsInCategory as Preset[]).map(p => (
                                        <button key={p.label} onClick={() => handlePresetSelect(activePersonIndex, p)} className="text-xs text-left p-2 bg-slate-800/50 hover:bg-fuchsia-500/20 rounded-md transition-colors truncate" title={t(p.label, language)}>{t(p.label, language)}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Section>

            <Section title={t('controlPanel.sections.accessories', language)}>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {renderSelect(t('controlPanel.labels.hat', language), activePerson.hat, e => handlePersonStateChange(activePersonIndex, 'hat', e.target.value), HAT_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.glasses', language), activePerson.glasses, e => handlePersonStateChange(activePersonIndex, 'glasses', e.target.value), GLASSES_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.earrings', language), activePerson.earrings, e => handlePersonStateChange(activePersonIndex, 'earrings', e.target.value), EARRING_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.necklace', language), activePerson.necklace, e => handlePersonStateChange(activePersonIndex, 'necklace', e.target.value), NECKLACE_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.bag', language), activePerson.bag, e => handlePersonStateChange(activePersonIndex, 'bag', e.target.value), BAG_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.weapon', language), activePerson.weapon, e => handlePersonStateChange(activePersonIndex, 'weapon', e.target.value), WEAPON_OPTIONS)}
                    {renderSelect(
                        t('controlPanel.labels.weaponQuantity', language),
                        activePerson.weaponQuantity,
                        e => handlePersonStateChange(activePersonIndex, 'weaponQuantity', e.target.value),
                        WEAPON_QUANTITY_OPTIONS,
                        !activePerson.weapon || PLURAL_WEAPONS.has(activePerson.weapon)
                    )}
                 </div>
            </Section>

             <Section title={t('controlPanel.sections.legwear', language)}>
                <div className="space-y-3">
                    <div className="p-2 border border-slate-700/50 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-sm font-medium text-slate-300">{t('controlPanel.labels.pantyhose', language)}</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id={`pantyhoseMetallic-${activePerson.id}`} checked={activePerson.pantyhoseMetallic} onChange={e => handleMetallicToggle('pantyhose', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                                <label htmlFor={`pantyhoseMetallic-${activePerson.id}`} className="text-sm text-slate-300">{t('controlPanel.labels.metallic', language)}</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                            <select value={pantyhoseModesRef.current[activePerson.id] || ''} onChange={e => {
                                const newMode = e.target.value;
                                pantyhoseModesRef.current[activePerson.id] = newMode;
                                const newValue = getLegwearValue(newMode, pantyhoseColorsRef.current[activePerson.id], undefined, activePerson.pantyhoseMetallic);
                                handlePersonStateChange(activePersonIndex, 'pantyhose', newValue);
                            }} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500">
                                {LEGWEAR_OPTIONS.map(opt => <option key={opt.v} value={opt.v}>{t(opt.t, language)}</option>)}
                            </select>
                           <div className="flex gap-2">
                               <div className="relative flex-1" ref={colorPickerRef}>
                                   <button onClick={() => setShowPantyhoseColorPicker(p => !p)} className="w-full text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.selectColor', language)}</button>
                                   {showPantyhoseColorPicker && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-slate-900 p-2 rounded-md shadow-lg border border-fuchsia-500/20 grid grid-cols-8 gap-2 w-max">{LEGWEAR_PICKER_COLORS.map(c => <div key={c} onClick={() => handleSelectColorPantyhose(COLOR_NAME_TO_HEX_MAP[c])} style={{backgroundColor: COLOR_NAME_TO_HEX_MAP[c]}} className="w-6 h-6 rounded-full cursor-pointer border border-white/20"></div>)}</div>}
                               </div>
                               <button onClick={handleRandomColorPantyhose} className="flex-1 text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.randomColorPantyhose', language)}</button>
                           </div>
                        </div>
                    </div>
                     <div className="p-2 border border-slate-700/50 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-sm font-medium text-slate-300">{t('controlPanel.labels.stockings', language)}</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id={`stockingsMetallic-${activePerson.id}`} checked={activePerson.stockingsMetallic} onChange={e => handleMetallicToggle('stockings', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                                <label htmlFor={`stockingsMetallic-${activePerson.id}`} className="text-sm text-slate-300">{t('controlPanel.labels.metallic', language)}</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                            <select value={stockingsModesRef.current[activePerson.id] || ''} onChange={e => {
                                const newMode = e.target.value;
                                stockingsModesRef.current[activePerson.id] = newMode;
                                const newValue = getLegwearValue(newMode, stockingsColorsRef.current[activePerson.id], activePerson.stockingLength, activePerson.stockingsMetallic);
                                handlePersonStateChange(activePersonIndex, 'stockings', newValue);
                            }} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500">
                                {STOCKINGS_OPTIONS.map(opt => <option key={opt.v} value={opt.v}>{t(opt.t, language)}</option>)}
                            </select>
                            <div className="flex gap-2">
                                 <div className="relative flex-1" ref={stockingsColorPickerRef}>
                                     <button onClick={() => setShowStockingsColorPicker(p => !p)} className="w-full text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.selectColor', language)}</button>
                                     {showStockingsColorPicker && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-slate-900 p-2 rounded-md shadow-lg border border-fuchsia-500/20 grid grid-cols-8 gap-2 w-max">{LEGWEAR_PICKER_COLORS.map(c => <div key={c} onClick={() => handleSelectColorStockings(COLOR_NAME_TO_HEX_MAP[c])} style={{backgroundColor: COLOR_NAME_TO_HEX_MAP[c]}} className="w-6 h-6 rounded-full cursor-pointer border border-white/20"></div>)}</div>}
                                 </div>
                                 <button onClick={handleRandomColorStockings} className="flex-1 text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.randomColorStockings', language)}</button>
                            </div>
                        </div>
                        {renderSelect("", activePerson.stockingLength, e => handleStockingLengthChange(e.target.value), STOCKING_LENGTH_OPTIONS)}
                     </div>
                     <div className="p-2 border border-slate-700/50 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-sm font-medium text-slate-300">{t('controlPanel.labels.leggings', language)}</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id={`leggingsMetallic-${activePerson.id}`} checked={activePerson.leggingsMetallic} onChange={e => handleMetallicToggle('leggings', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                                <label htmlFor={`leggingsMetallic-${activePerson.id}`} className="text-sm text-slate-300">{t('controlPanel.labels.metallic', language)}</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                            <select value={leggingsModesRef.current[activePerson.id] || ''} onChange={e => {
                                const newMode = e.target.value;
                                leggingsModesRef.current[activePerson.id] = newMode;
                                const newValue = getLegwearValue(newMode, leggingsColorsRef.current[activePerson.id], undefined, activePerson.leggingsMetallic);
                                handlePersonStateChange(activePersonIndex, 'leggings', newValue);
                                }} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500">
                                {LEGGINGS_OPTIONS.map(opt => <option key={opt.v} value={opt.v}>{t(opt.t, language)}</option>)}
                            </select>
                             <div className="flex gap-2">
                                 <div className="relative flex-1" ref={leggingsColorPickerRef}>
                                     <button onClick={() => setShowLeggingsColorPicker(p => !p)} className="w-full text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.selectColor', language)}</button>
                                     {showLeggingsColorPicker && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-slate-900 p-2 rounded-md shadow-lg border border-fuchsia-500/20 grid grid-cols-8 gap-2 w-max">{LEGWEAR_PICKER_COLORS.map(c => <div key={c} onClick={() => handleSelectColorLeggings(COLOR_NAME_TO_HEX_MAP[c])} style={{backgroundColor: COLOR_NAME_TO_HEX_MAP[c]}} className="w-6 h-6 rounded-full cursor-pointer border border-white/20"></div>)}</div>}
                                 </div>
                                 <button onClick={handleRandomColorLeggings} className="flex-1 text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.randomColorLeggings', language)}</button>
                             </div>
                        </div>
                     </div>
                     <div className="p-2 border border-slate-700/50 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-sm font-medium text-slate-300">{t('controlPanel.labels.socks', language)}</label>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id={`socksMetallic-${activePerson.id}`} checked={activePerson.socksMetallic} onChange={e => handleMetallicToggle('socks', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500" />
                                <label htmlFor={`socksMetallic-${activePerson.id}`} className="text-sm text-slate-300">{t('controlPanel.labels.metallic', language)}</label>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                            <select value={socksModesRef.current[activePerson.id] || ''} onChange={e => {
                                const newMode = e.target.value;
                                socksModesRef.current[activePerson.id] = newMode;
                                const newValue = getLegwearValue(newMode, socksColorsRef.current[activePerson.id], activePerson.sockLength, activePerson.socksMetallic);
                                handlePersonStateChange(activePersonIndex, 'socks', newValue);
                                }} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500">
                                {SOCKS_OPTIONS.map(opt => <option key={opt.v} value={opt.v}>{t(opt.t, language)}</option>)}
                            </select>
                             <div className="flex gap-2">
                                 <div className="relative flex-1" ref={socksColorPickerRef}>
                                     <button onClick={() => setShowSocksColorPicker(p => !p)} className="w-full text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.selectColor', language)}</button>
                                     {showSocksColorPicker && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-slate-900 p-2 rounded-md shadow-lg border border-fuchsia-500/20 grid grid-cols-8 gap-2 w-max">{LEGWEAR_PICKER_COLORS.map(c => <div key={c} onClick={() => handleSelectColorSocks(COLOR_NAME_TO_HEX_MAP[c])} style={{backgroundColor: COLOR_NAME_TO_HEX_MAP[c]}} className="w-6 h-6 rounded-full cursor-pointer border border-white/20"></div>)}</div>}
                                 </div>
                                 <button onClick={handleRandomColorSocks} className="flex-1 text-sm bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md transition-colors hover:bg-fuchsia-500/20">{t('controlPanel.buttons.randomColorSocks', language)}</button>
                             </div>
                         </div>
                        {renderSelect("", activePerson.sockLength, e => handleSockLengthChange(e.target.value), SOCK_LENGTH_OPTIONS)}
                     </div>

                    <div>
                        <button onClick={() => setShowShoeDetail(s => !s)} className="text-xs text-cyan-400 hover:underline mb-2">{showShoeDetail ? t('controlPanel.buttons.showSimple', language) : t('controlPanel.buttons.showDetail', language)}</button>
                        {showShoeDetail ? 
                            renderSelect('', activePerson.shoe, e => handlePersonStateChange(activePersonIndex, 'shoe', e.target.value), SHOES) : 
                            renderSelect(t('controlPanel.labels.shoesQuick', language), activePerson.shoeQuick, e => { handlePersonStateChange(activePersonIndex, 'shoeQuick', e.target.value); handlePersonStateChange(activePersonIndex, 'shoe', ''); }, SHOE_QUICK_OPTIONS)}
                    </div>
                </div>
             </Section>

            <Section title={t('controlPanel.sections.environment', language)}>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {renderSelect(t('controlPanel.labels.atmosphere', language), promptState.atmosphere, handleAtmosphereChange, ATMOSPHERE_OPTIONS, isGeneratingAtmosphere || promptState.removeBackground)}
                    {renderSelect(t('controlPanel.labels.timeOfDay', language), promptState.timeOfDay, e => handleStateChange('timeOfDay', e.target.value), TIME_OF_DAY_OPTIONS, promptState.removeBackground)}
                    {renderSelect(t('controlPanel.labels.weather', language), promptState.weather, e => handleStateChange('weather', e.target.value), WEATHER_OPTIONS, promptState.removeBackground)}
                    {renderSelect(t('controlPanel.labels.vehicle', language), promptState.vehicle, e => handleStateChange('vehicle', e.target.value), VEHICLE_OPTIONS)}
                    {renderSelect(t('controlPanel.labels.pet', language), promptState.pet, e => handleStateChange('pet', e.target.value), PET_OPTIONS)}
                 </div>
                 <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t('controlPanel.labels.background', language)}</label>
                    <div className="flex gap-2">
                         <select 
                            value={BACKGROUND_OPTIONS.some(o => o.v === promptState.background) ? promptState.background : ''} 
                            onChange={e => handleStateChange('background', e.target.value)} 
                            disabled={promptState.removeBackground} 
                            className="w-1/2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {BACKGROUND_OPTIONS.map(opt => <option key={opt.v} value={opt.v}>{t(opt.t, language)}</option>)}
                        </select>
                        <input 
                            type="text" 
                            value={promptState.background} 
                            onChange={e => handleStateChange('background', e.target.value)} 
                            placeholder={t('controlPanel.placeholders.background', language)} 
                            disabled={promptState.removeBackground}
                            className="w-1/2 bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" 
                        />
                    </div>
                </div>
                 <div className="flex items-center gap-2 mt-3">
                    <input
                        type="checkbox"
                        id="removeBackground"
                        checked={promptState.removeBackground}
                        onChange={e => handleStateChange('removeBackground', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                    />
                    <label htmlFor="removeBackground" className="text-sm text-slate-300">
                        {t('controlPanel.labels.removeBackground', language)}
                    </label>
                 </div>
                 <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t('controlPanel.labels.poseAction', language)}</label>
                    <input type="text" value={promptState.pose} onChange={e => handleStateChange('pose', e.target.value)} placeholder={t('controlPanel.placeholders.pose', language)} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                 </div>
            </Section>

            <Section title={t('controlPanel.sections.styleTransfer', language)}>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Object.keys(STYLE_PROMPT_MAP).map(key => (
                        <button key={key} onClick={() => onStyleButtonClick(key)} disabled={isGenerating} className="text-xs p-2 bg-slate-800/50 hover:bg-cyan-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {t(`controlPanel.styleTransfer.${key}`, language)}
                        </button>
                    ))}
                </div>
                 <button 
                    onClick={onSora2StyleTransfer} 
                    disabled={isGenerating} 
                    className="mt-3 w-full text-sm font-bold p-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:opacity-90 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('controlPanel.styleTransfer.sora2', language)}
                </button>
                <div className="flex gap-2 mt-3">
                    <input
                        type="text"
                        value={animeStyleInput}
                        onChange={e => setAnimeStyleInput(e.target.value)}
                        placeholder={t('controlPanel.placeholders.animeStyle', language)}
                        className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    />
                    <button
                        onClick={() => onCustomStyleTransfer(animeStyleInput)}
                        disabled={isGenerating || !animeStyleInput.trim()}
                        className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        {t('controlPanel.buttons.applyStyle', language)}
                    </button>
                </div>
            </Section>

            <Section title={t('controlPanel.sections.color', language)}>
                <div className="max-h-48 overflow-y-auto pr-2">
                    <div className="grid grid-cols-8 gap-2">
                        {LEGWEAR_PICKER_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => onColorizeImage(color)}
                                disabled={isColorizing || isGenerating}
                                className="h-6 rounded-md border-2 border-transparent transition-all hover:border-cyan-400 disabled:opacity-50"
                                style={{ backgroundColor: COLOR_NAME_TO_HEX_MAP[color] }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            </Section>

            <Section title={t('controlPanel.sections.fixedPrompts', language)}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FIXED_PROMPTS.map(p => {
                        if (p.key === 'hourglass_waist') {
                            return (
                                <button
                                    key={p.key}
                                    onClick={handleHourglassToggle}
                                    className={`text-xs p-2 rounded-md transition-colors ${activePerson.hasHourglassWaist ? 'bg-fuchsia-500/30 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    {t(p.label, language)}
                                </button>
                            );
                        }
                        if (p.key === 'ripped') {
                            return (
                                <button
                                    key={p.key}
                                    onClick={handleRippedToggle}
                                    className={`text-xs p-2 rounded-md transition-colors ${activePerson.hasRippedBody ? 'bg-fuchsia-500/30 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`}
                                >
                                    {t(p.label, language)}
                                </button>
                            );
                        }
                        return (
                            <button
                                key={p.key}
                                onClick={() => handleFixedPromptToggle(p.key)}
                                className={`text-xs p-2 rounded-md transition-colors ${promptState.fixedPrompts.includes(p.key) ? 'bg-fuchsia-500/30 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}`}
                            >
                                {t(p.label, language)}
                            </button>
                        );
                    })}
                </div>
            </Section>
            
            <Section title={t('controlPanel.sections.gemini', language)}>
                <div className="flex border-b border-slate-700 mb-3 overflow-x-auto">
                    {(['analyze', 'edit', 'background', 'pose', 'scene', 'video', 'realify', 'live'] as const).map(feature => (
                        <button
                            key={feature}
                            onClick={() => setActiveVisionFeature(feature)}
                            className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${activeVisionFeature === feature ? 'border-b-2 border-fuchsia-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            {t(`controlPanel.buttons.${feature}`, language)}
                        </button>
                    ))}
                </div>

                {activeVisionFeature === 'analyze' && (
                    <div className="space-y-3">
                        {renderDropZone( 'file-input-1-analyze', isDragging1, (e) => handleDragOver(e, setIsDragging1), (e) => handleDragLeave(e, setIsDragging1), (e) => handleDrop(e, 1), fileInputRef1, (e) => handleFileSelect(e, 1), uploadedImageData1, t('controlPanel.placeholders.dropOrClickAnalyze', language), () => { setUploadedImageData1(null); setAnalyzedData(null); }
                        )}
                        <button onClick={() => uploadedImageData1 && onAnalyzeImage(uploadedImageData1.base64, uploadedImageData1.mimeType)} disabled={isGenerating || !uploadedImageData1} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed" >
                            {isGenerating ? t('controlPanel.buttons.analyzingScene', language) : t('controlPanel.buttons.analyze', language)}
                        </button>
                        {analysisError && <p className="text-red-400 text-xs">{analysisError}</p>}
                        {analyzedData && ( <textarea value={analyzedData.outfit} readOnly rows={4} className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono" /> )}
                    </div>
                )}

                {activeVisionFeature === 'edit' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            {renderDropZone( 'file-input-1-edit', isDragging1, (e) => handleDragOver(e, setIsDragging1), (e) => handleDragLeave(e, setIsDragging1), (e) => handleDrop(e, 1), fileInputRef1, (e) => handleFileSelect(e, 1), uploadedImageData1, t('controlPanel.placeholders.dropOrClickOriginal', language), () => setUploadedImageData1(null))}
                             {renderDropZone( 'file-input-2-edit', isDragging2, (e) => handleDragOver(e, setIsDragging2), (e) => handleDragLeave(e, setIsDragging2), (e) => handleDrop(e, 2), fileInputRef2, (e) => handleFileSelect(e, 2), uploadedImageData2, t('controlPanel.placeholders.sourceImage', language), () => setUploadedImageData2(null))}
                        </div>
                        <textarea value={editPrompt} onChange={e => { setEditPrompt(e.target.value); setIsEditPromptDirty(true); }} placeholder={t('controlPanel.placeholders.editPrompt', language)} rows={4} className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 font-mono" />
                        <button onClick={handleExecuteEdit} disabled={isGenerating || !uploadedImageData1 || isAnalyzingSourceOutfit} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed" >
                            {isAnalyzingSourceOutfit ? t('controlPanel.buttons.analyzingSourceOutfit', language) : t('controlPanel.buttons.executeEdit', language)}
                        </button>
                        {analysisError && <p className="text-red-400 text-xs">{analysisError}</p>}
                    </div>
                )}

                {activeVisionFeature === 'background' && (
                    <div className="space-y-3">
                        <div 
                            onDragOver={(e) => handleDragOver(e, setIsDraggingBg)}
                            onDragLeave={(e) => handleDragLeave(e, setIsDraggingBg)}
                            onDrop={handleBgFileDrop}
                            onClick={() => !pendingBgImage && bgFileInputRef.current?.click()}
                            className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors flex items-center justify-center min-h-[152px] ${isDraggingBg ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-600 hover:border-slate-500'} ${!pendingBgImage ? 'cursor-pointer' : ''}`}
                        >
                            <input type="file" ref={bgFileInputRef} onChange={handleBgFileSelect} className="hidden" accept="image/*" />
                            {isProcessingBg ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400"></div>
                            ) : pendingBgImage ? (
                                <div className="relative inline-block">
                                    <img src={pendingBgImage.previewUrl} alt="BG Preview" className="max-h-32 mx-auto rounded-md" />
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400">{t('controlPanel.placeholders.dropOrClickBg', language)}</span>
                            )}
                        </div>
                        {pendingBgImage && (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleConfirmBackground} disabled={isProcessingBg} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:bg-slate-500">Analyze for Prompt</button>
                                <button onClick={handleUseBackgroundDirectly} disabled={isProcessingBg} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm disabled:bg-slate-500">Use Directly (Experimental)</button>
                            </div>
                        )}
                    </div>
                )}

                {activeVisionFeature === 'pose' && (
                    <div className="space-y-3">
                        <div 
                            onDragOver={(e) => handleDragOver(e, setIsDraggingPose)}
                            onDragLeave={(e) => handleDragLeave(e, setIsDraggingPose)}
                            onDrop={handlePoseFileDrop}
                            onClick={() => !poseImageFile && poseFileInputRef.current?.click()}
                            className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors flex items-center justify-center min-h-[152px] ${isDraggingPose ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-600 hover:border-slate-500'} ${!poseImageFile ? 'cursor-pointer' : ''}`}
                        >
                            <input type="file" ref={poseFileInputRef} onChange={handlePoseFileSelect} className="hidden" accept="image/*" />
                            {isAnalyzingPose ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400"></div>
                            ) : poseImagePreview ? (
                                <div className="relative inline-block">
                                    <img src={poseImagePreview} alt="Pose Preview" className="max-h-32 mx-auto rounded-md" />
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setPoseImageFile(null);
                                            setPoseImagePreview('');
                                            setPromptState(p => ({...p, pose: '__random__'}));
                                            addLog('Pose reference image cleared.');
                                        }} 
                                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs leading-none z-10"
                                        aria-label="Remove image"
                                        title="Remove image"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400">{t('controlPanel.placeholders.dropOrClickPose', language)}</span>
                            )}
                        </div>
                    </div>
                )}

                {activeVisionFeature === 'scene' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="text" value={cinematicTitle} onChange={e => setCinematicTitle(e.target.value)} placeholder={t('controlPanel.placeholders.movieTitle', language)} className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                            <button onClick={() => onAnalyzeScene(cinematicTitle)} disabled={isAnalyzingScene || !cinematicTitle} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                                {isAnalyzingScene ? t('controlPanel.buttons.analyzingScene', language) : t('controlPanel.buttons.analyze', language)}
                            </button>
                        </div>
                         <div className="flex gap-2">
                             <input type="text" value={mangaTitle} onChange={e => setMangaTitle(e.target.value)} placeholder={t('controlPanel.placeholders.mangaTitle', language)} className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                             <input type="text" value={mangaCharacter} onChange={e => setMangaCharacter(e.target.value)} placeholder={t('controlPanel.placeholders.mangaCharacter', language)} className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                            <button onClick={() => onAnalyzeCharacterOutfit(mangaTitle, mangaCharacter)} disabled={isAnalyzingOutfit || !mangaTitle || !mangaCharacter} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                                {isAnalyzingOutfit ? t('controlPanel.buttons.analyzingScene', language) : t('controlPanel.buttons.analyze', language)}
                            </button>
                        </div>
                    </div>
                )}

                {activeVisionFeature === 'video' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <textarea value={videoGenPrompt} onChange={e => setVideoGenPrompt(e.target.value)} placeholder="A detailed video prompt... (e.g., A cat wearing sunglasses driving a car on Mars)" rows={5} className="col-span-2 w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500 font-mono" />
                            <div 
                                onDragOver={(e) => handleDragOver(e, setIsDraggingVideo)}
                                onDragLeave={(e) => handleDragLeave(e, setIsDraggingVideo)}
                                onDrop={handleVideoDrop}
                                onClick={() => !videoSourceImage && fileInputRefVideo.current?.click()}
                                className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors flex items-center justify-center min-h-[152px] ${isDraggingVideo ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-600 hover:border-slate-500'} ${!videoSourceImage ? 'cursor-pointer' : ''}`}
                            >
                                <input type="file" ref={fileInputRefVideo} onChange={handleVideoFileSelect} className="hidden" accept="image/*" />
                                {videoSourceImage ? (
                                    <div className="relative inline-block">
                                        <img src={videoSourceImage.previewUrl} alt="Video source" className="max-h-32 mx-auto rounded-md" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setVideoSourceImage(null); }} 
                                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs leading-none z-10"
                                            aria-label="Remove image"
                                            title="Remove image"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">Drop starting image (optional)</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input type="text" value={videoIdeaInput} onChange={e => setVideoIdeaInput(e.target.value)} placeholder={t('controlPanel.placeholders.videoIdea', language)} className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                                <button onClick={handleCreateVideoPrompt} disabled={isCreatingVideoPrompt || !videoIdeaInput} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                                    {isCreatingVideoPrompt ? "Creating..." : "Create Prompt from Idea"}
                                </button>
                                <button onClick={() => onGenerateVideoFromPrompt(videoGenPrompt, videoSourceImage || undefined)} disabled={isGeneratingVideo || !videoGenPrompt} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                                    {isGeneratingVideo ? "Generating Video..." : "Generate Video"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                 {activeVisionFeature === 'realify' && (
                    <div className="space-y-3">
                         {renderDropZone( 'file-input-realify', isDraggingRealify, (e) => handleDragOver(e, setIsDraggingRealify), (e) => handleDragLeave(e, setIsDraggingRealify), async (e) => {
                             e.preventDefault(); e.stopPropagation(); setIsDraggingRealify(false);
                             const file = e.dataTransfer.files?.[0];
                             if (file) { const d = await processAndValidateFile(file); if (d) setUploadedImageDataRealify(d); }
                         }, fileInputRefRealify, async (e) => {
                            const file = e.target.files?.[0];
                             if (file) { const d = await processAndValidateFile(file); if (d) setUploadedImageDataRealify(d); }
                             if (e.target) e.target.value = '';
                         }, uploadedImageDataRealify, t('controlPanel.placeholders.dropOrClickRealify', language), () => setUploadedImageDataRealify(null)
                        )}
                        <button onClick={() => uploadedImageDataRealify && onRealifyImage(uploadedImageDataRealify)} disabled={isGenerating || !uploadedImageDataRealify} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed" >
                            {isGenerating ? "Processing..." : "Make Photorealistic"}
                        </button>
                    </div>
                 )}
                
                {activeVisionFeature === 'live' && (
                    <LiveConversation language={language} addLog={addLog} />
                )}

            </Section>
        </>
      )}
    </aside>
  );
};

// Fix: Add default export for ControlPanel component
export default ControlPanel;