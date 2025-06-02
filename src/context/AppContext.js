/**
 * CartoonizeMe Application Context
 * 
 * This context provides centralized state management for the entire application,
 * managing video data, processing states, user preferences, and error handling.
 * 
 * Requirements addressed:
 * - REQ-047: Context API for application state management
 * - REQ-048: Persistent storage for user preferences (localStorage)
 * - REQ-049: Error state management with user-friendly messages
 * - REQ-050: Loading state management for async operations
 * 
 * @author CartoonizeMe Team
 */

import React, { createContext, useReducer, useEffect, useCallback } from 'react';

/**
 * Application State Interface
 * Defines the shape of the global application state
 */
const initialState = {
    // Application flow state
    appState: 'upload', // 'upload' | 'styleSelection' | 'processing' | 'results'
    isLoading: false,
    error: null,

    // Video data
    currentVideo: null, // { file, metadata, thumbnail, duration, frames }
    videoHistory: [], // Array of previously processed videos

    // Style selection
    selectedStyle: null, // Selected style object
    availableStyles: [], // Array of available styles
    customStyles: [], // User uploaded custom styles (future feature)

    // Processing state
    processingState: {
        stage: null, // 'extraction' | 'transfer' | 'reconstruction'
        progress: 0, // 0-100
        currentFrame: 0,
        totalFrames: 0,
        timeRemaining: null,
        canCancel: true,
        completed: false,
        result: null // Final processed video data
    },

    // User preferences (REQ-048)
    preferences: {
        outputFormat: 'mp4', // 'mp4' | 'webm'
        quality: 'high', // 'low' | 'medium' | 'high'
        enableGPU: true,
        showPreviewFrames: true,
        autoDownload: false
    },

    // Performance data
    performance: {
        lastProcessingTime: null,
        averageProcessingTime: null,
        memoryUsage: null,
        deviceCapabilities: null
    }
};

/**
 * Application Actions
 * Defines all possible actions that can modify the application state
 */
const actionTypes = {
    // App state actions
    SET_APP_STATE: 'SET_APP_STATE',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',

    // Video actions
    SET_CURRENT_VIDEO: 'SET_CURRENT_VIDEO',
    CLEAR_CURRENT_VIDEO: 'CLEAR_CURRENT_VIDEO',
    ADD_TO_HISTORY: 'ADD_TO_HISTORY',

    // Style actions
    SET_SELECTED_STYLE: 'SET_SELECTED_STYLE',
    SET_AVAILABLE_STYLES: 'SET_AVAILABLE_STYLES',
    ADD_CUSTOM_STYLE: 'ADD_CUSTOM_STYLE',

    // Processing actions
    SET_PROCESSING_STATE: 'SET_PROCESSING_STATE',
    UPDATE_PROGRESS: 'UPDATE_PROGRESS',
    SET_PROCESSING_RESULT: 'SET_PROCESSING_RESULT',
    RESET_PROCESSING: 'RESET_PROCESSING',

    // Preferences actions
    UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
    RESET_PREFERENCES: 'RESET_PREFERENCES',

    // Performance actions
    UPDATE_PERFORMANCE: 'UPDATE_PERFORMANCE',

    // Reset actions
    RESET_ALL: 'RESET_ALL'
};

/**
 * State Reducer
 * Handles all state updates in a predictable way
 */
function appReducer(state, action) {
    switch (action.type) {
        case actionTypes.SET_APP_STATE:
            return {
                ...state,
                appState: action.payload,
                error: null // Clear errors when changing states
            };

        case actionTypes.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload
            };

        case actionTypes.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };

        case actionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        case actionTypes.SET_CURRENT_VIDEO:
            return {
                ...state,
                currentVideo: action.payload,
                appState: action.payload ? 'styleSelection' : 'upload',
                selectedStyle: null, // Reset style when new video is uploaded
                processingState: { ...initialState.processingState }
            };

        case actionTypes.CLEAR_CURRENT_VIDEO:
            return {
                ...state,
                currentVideo: null,
                selectedStyle: null,
                appState: 'upload',
                processingState: { ...initialState.processingState }
            };

        case actionTypes.ADD_TO_HISTORY:
            return {
                ...state,
                videoHistory: [action.payload, ...state.videoHistory.slice(0, 9)] // Keep last 10
            };

        case actionTypes.SET_SELECTED_STYLE:
            return {
                ...state,
                selectedStyle: action.payload,
                appState: action.payload ? 'processing' : 'styleSelection'
            };

        case actionTypes.SET_AVAILABLE_STYLES:
            return {
                ...state,
                availableStyles: action.payload
            };

        case actionTypes.ADD_CUSTOM_STYLE:
            return {
                ...state,
                customStyles: [...state.customStyles, action.payload]
            };

        case actionTypes.SET_PROCESSING_STATE:
            return {
                ...state,
                processingState: {
                    ...state.processingState,
                    ...action.payload
                }
            };

        case actionTypes.UPDATE_PROGRESS:
            return {
                ...state,
                processingState: {
                    ...state.processingState,
                    progress: action.payload.progress,
                    currentFrame: action.payload.currentFrame || state.processingState.currentFrame,
                    timeRemaining: action.payload.timeRemaining || state.processingState.timeRemaining
                }
            };

        case actionTypes.SET_PROCESSING_RESULT:
            return {
                ...state,
                processingState: {
                    ...state.processingState,
                    completed: true,
                    result: action.payload,
                    progress: 100
                },
                appState: 'results'
            };

        case actionTypes.RESET_PROCESSING:
            return {
                ...state,
                processingState: { ...initialState.processingState }
            };

        case actionTypes.UPDATE_PREFERENCES:
            const newPreferences = { ...state.preferences, ...action.payload };
            // Save to localStorage (REQ-048)
            try {
                localStorage.setItem('cartoonizeme_preferences', JSON.stringify(newPreferences));
            } catch (error) {
                console.warn('Failed to save preferences to localStorage:', error);
            }
            return {
                ...state,
                preferences: newPreferences
            };

        case actionTypes.RESET_PREFERENCES:
            const defaultPrefs = initialState.preferences;
            try {
                localStorage.removeItem('cartoonizeme_preferences');
            } catch (error) {
                console.warn('Failed to remove preferences from localStorage:', error);
            }
            return {
                ...state,
                preferences: defaultPrefs
            };

        case actionTypes.UPDATE_PERFORMANCE:
            return {
                ...state,
                performance: {
                    ...state.performance,
                    ...action.payload
                }
            };

        case actionTypes.RESET_ALL:
            return {
                ...initialState,
                preferences: state.preferences // Keep user preferences
            };

        default:
            console.warn('Unknown action type:', action.type);
            return state;
    }
}

/**
 * Load user preferences from localStorage (REQ-048)
 */
function loadPreferences() {
    try {
        const saved = localStorage.getItem('cartoonizeme_preferences');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Validate preferences structure
            if (typeof parsed === 'object' && parsed !== null) {
                return { ...initialState.preferences, ...parsed };
            }
        }
    } catch (error) {
        console.warn('Failed to load preferences from localStorage:', error);
    }
    return initialState.preferences;
}

// Create context
const AppContext = createContext();

/**
 * App Context Provider Component
 * Provides state and actions to all child components
 */
function AppProvider({ children }) {
    // Initialize state with loaded preferences
    const [state, dispatch] = useReducer(appReducer, {
        ...initialState,
        preferences: loadPreferences()
    });

    /**
     * Action creators for better developer experience
     * These functions provide a clean API for updating state
     */
    const actions = {
        // App state actions
        setAppState: useCallback((appState) => {
            dispatch({ type: actionTypes.SET_APP_STATE, payload: appState });
        }, []),

        setLoading: useCallback((isLoading) => {
            dispatch({ type: actionTypes.SET_LOADING, payload: isLoading });
        }, []),

        setError: useCallback((error) => {
            const errorObj = error instanceof Error ?
                { message: error.message, stack: error.stack } :
                { message: String(error) };

            console.error('App error set:', errorObj);
            dispatch({ type: actionTypes.SET_ERROR, payload: errorObj });
        }, []),

        clearError: useCallback(() => {
            dispatch({ type: actionTypes.CLEAR_ERROR });
        }, []),

        // Video actions
        setCurrentVideo: useCallback((video) => {
            dispatch({ type: actionTypes.SET_CURRENT_VIDEO, payload: video });
        }, []),

        clearCurrentVideo: useCallback(() => {
            dispatch({ type: actionTypes.CLEAR_CURRENT_VIDEO });
        }, []),

        addToHistory: useCallback((videoData) => {
            dispatch({ type: actionTypes.ADD_TO_HISTORY, payload: videoData });
        }, []),

        // Style actions
        setSelectedStyle: useCallback((style) => {
            dispatch({ type: actionTypes.SET_SELECTED_STYLE, payload: style });
        }, []),

        setAvailableStyles: useCallback((styles) => {
            dispatch({ type: actionTypes.SET_AVAILABLE_STYLES, payload: styles });
        }, []),

        addCustomStyle: useCallback((style) => {
            dispatch({ type: actionTypes.ADD_CUSTOM_STYLE, payload: style });
        }, []),

        // Processing actions
        setProcessingState: useCallback((stateUpdate) => {
            dispatch({ type: actionTypes.SET_PROCESSING_STATE, payload: stateUpdate });
        }, []),

        updateProgress: useCallback((progressData) => {
            dispatch({ type: actionTypes.UPDATE_PROGRESS, payload: progressData });
        }, []),

        setProcessingResult: useCallback((result) => {
            dispatch({ type: actionTypes.SET_PROCESSING_RESULT, payload: result });
        }, []),

        resetProcessing: useCallback(() => {
            dispatch({ type: actionTypes.RESET_PROCESSING });
        }, []),

        // Preferences actions
        updatePreferences: useCallback((preferences) => {
            dispatch({ type: actionTypes.UPDATE_PREFERENCES, payload: preferences });
        }, []),

        resetPreferences: useCallback(() => {
            dispatch({ type: actionTypes.RESET_PREFERENCES });
        }, []),

        // Performance actions
        updatePerformance: useCallback((performanceData) => {
            dispatch({ type: actionTypes.UPDATE_PERFORMANCE, payload: performanceData });
        }, []),

        // Utility actions
        resetAll: useCallback(() => {
            dispatch({ type: actionTypes.RESET_ALL });
        }, []),

        // Workflow actions (combinations of basic actions)
        startNewVideo: useCallback(() => {
            dispatch({ type: actionTypes.CLEAR_CURRENT_VIDEO });
            dispatch({ type: actionTypes.CLEAR_ERROR });
        }, []),

        startProcessing: useCallback(() => {
            dispatch({ type: actionTypes.SET_APP_STATE, payload: 'processing' });
            dispatch({ type: actionTypes.RESET_PROCESSING });
            dispatch({ type: actionTypes.SET_PROCESSING_STATE, payload: { stage: 'starting', canCancel: true } });
        }, [])
    };

    // Log state changes in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 App state updated:', {
                appState: state.appState,
                hasVideo: !!state.currentVideo,
                hasStyle: !!state.selectedStyle,
                processing: state.processingState.stage,
                error: state.error?.message
            });
        }
    }, [state.appState, state.currentVideo, state.selectedStyle, state.processingState.stage, state.error]);

    // Context value with state and actions
    const contextValue = {
        // State
        ...state,

        // Actions
        ...actions,

        // Computed values
        canProcess: state.currentVideo && state.selectedStyle && !state.processingState.completed,
        hasResult: state.processingState.completed && state.processingState.result,
        isProcessing: state.appState === 'processing' && !state.processingState.completed
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

// Export context and provider
export { AppContext, AppProvider, actionTypes };

// Custom hook for using the context
export function useAppContext() {
    const context = React.useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
} 