"use strict";
/**
 * @file Firebase Admin initialization module for voice server.
 * @description
 * Loads environment variables, parses the Firebase service account JSON, validates
 * required environment variables, initializes the Firebase Admin SDK and exports
 * Firestore client for use in voice operations.
 *
 * Expected environment variables:
 *  - FIREBASE_PROJECT_ID: Firebase project id (string)
 *  - FIREBASE_SERVICE_ACCOUNT_KEY: JSON string of the Firebase service account
 *
 * Usage:
 *  import { db } from './config/firebase';
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
console.log('🔹 [FIREBASE] Cargando configuración para servidor de voz...');
dotenv_1.default.config();
/**
 * Parse the Firebase service account JSON from the environment.
 *
 * @returns {admin.ServiceAccount} Parsed service account object.
 * @throws {SyntaxError} If the JSON in FIREBASE_SERVICE_ACCOUNT_KEY is invalid.
 */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
console.log('🔍 [FIREBASE] Verificando variables...');
console.log(' - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ OK' : '❌ NO DEFINIDA');
console.log(' - FIREBASE_SERVICE_ACCOUNT_KEY:', serviceAccount ? '✅ OK' : '❌ NO DEFINIDA');
/**
 * Ensure required environment variables are present before initializing Firebase.
 * If any required variable is missing, an Error is thrown to prevent the app from continuing.
 *
 * @throws {Error} If FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT_KEY is missing.
 */
if (!process.env.FIREBASE_PROJECT_ID || !serviceAccount) {
    throw new Error('❌ Faltan variables de entorno para conectar con Firebase.');
}
/**
 * Initialize the Firebase Admin SDK with the provided service account and project ID.
 * The initialization attaches credentials and project configuration to the global admin instance.
 */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
});
/**
 * Firestore client instance to perform database operations for voice.
 * @type {admin.firestore.Firestore}
 */
const db = admin.firestore();
exports.db = db;
console.log('✅ [FIREBASE] Cliente inicializado correctamente para servidor de voz.');
