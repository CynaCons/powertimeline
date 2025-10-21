/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_VERSION?: string;
	readonly VITE_ENABLE_DEV_PANEL?: string;
	readonly VITE_ENABLE_DIAGNOSTICS_OVERLAY?: string;
	readonly VITE_ENABLE_TELEMETRY?: string;
	readonly VITE_FIREBASE_API_KEY?: string;
	readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
	readonly VITE_FIREBASE_PROJECT_ID?: string;
	readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
	readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
	readonly VITE_FIREBASE_APP_ID?: string;
	readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
	readonly VITE_LOG_LEVEL?: string;
	// Feature flags for layout engine
	readonly VITE_ENABLE_CLUSTER_COORDINATION?: string;
	readonly VITE_ENABLE_MIXED_CARD_TYPES?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Window interface augmentation for debug and telemetry features
interface Window {
	/** Debug flag for layout visualization */
	__CC_DEBUG_LAYOUT?: boolean;

	/** Timeline telemetry data for testing and debugging */
	__ccTelemetry?: {
		placements?: {
			items?: Array<{
				id: string;
				x: number;
				y: number;
				clusterId: string;
			}>;
		};
		groups?: {
			count?: number;
		};
		capacity?: {
			totalCells?: number;
		};
		[key: string]: unknown;
	};

	/** Debug function for inspecting timeline scales */
	debugTimelineScales?: () => unknown;
}
