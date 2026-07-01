'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InterviewState {
  currentQuestionIndex: number;
  questions: string[];
  currentQuestionText: string;
  isStreaming: boolean;
  answer: string;
  tips: string[];
  isLoadingTips: boolean;
  isSubmitting: boolean;
  error: string | null;
  timeLeft: number;
  isCodingMode: boolean;
  presetLanguage: string;
  warningToast: string | null;
}

const initialState: InterviewState = {
  currentQuestionIndex: 0,
  questions: [],
  currentQuestionText: '',
  isStreaming: false,
  answer: '',
  tips: [],
  isLoadingTips: false,
  isSubmitting: false,
  error: null,
  timeLeft: 0,
  isCodingMode: false,
  presetLanguage: 'javascript',
  warningToast: null,
};

export const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    initializeSession: (state, action: PayloadAction<{ questions: string[]; timerDuration: number }>) => {
      state.currentQuestionIndex = 0;
      state.questions = action.payload.questions;
      state.currentQuestionText = '';
      state.isStreaming = false;
      state.answer = '';
      state.tips = [];
      state.isLoadingTips = false;
      state.isSubmitting = false;
      state.error = null;
      state.timeLeft = action.payload.timerDuration;
      state.isCodingMode = false;
      state.presetLanguage = 'javascript';
      state.warningToast = null;
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
    },
    setQuestions: (state, action: PayloadAction<string[]>) => {
      state.questions = action.payload;
    },
    setCurrentQuestionText: (state, action: PayloadAction<string>) => {
      state.currentQuestionText = action.payload;
    },
    setIsStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    setAnswer: (state, action: PayloadAction<string>) => {
      state.answer = action.payload;
    },
    setTips: (state, action: PayloadAction<string[]>) => {
      state.tips = action.payload;
    },
    setIsLoadingTips: (state, action: PayloadAction<boolean>) => {
      state.isLoadingTips = action.payload;
    },
    setIsSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
    setIsCodingMode: (state, action: PayloadAction<boolean>) => {
      state.isCodingMode = action.payload;
    },
    setPresetLanguage: (state, action: PayloadAction<string>) => {
      state.presetLanguage = action.payload;
    },
    setWarningToast: (state, action: PayloadAction<string | null>) => {
      state.warningToast = action.payload;
    },
  },
});

export const {
  initializeSession,
  setCurrentQuestionIndex,
  setQuestions,
  setCurrentQuestionText,
  setIsStreaming,
  setAnswer,
  setTips,
  setIsLoadingTips,
  setIsSubmitting,
  setError,
  setTimeLeft,
  setIsCodingMode,
  setPresetLanguage,
  setWarningToast,
} = interviewSlice.actions;

export default interviewSlice.reducer;
