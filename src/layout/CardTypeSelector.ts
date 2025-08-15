import { Event } from '../types';
import { CardType, CardConfig, LayoutConfig } from './types';

export class CardTypeSelector {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  // Select appropriate card type based on available space and content
  selectCardType(
    event: Event,
    availableSlots: number,
    totalEventsInCluster: number,
    preferredType: CardType = 'full'
  ): CardType {
    
    // Priority order: full -> compact -> title-only -> multi-event -> infinite
    const typesPriority: CardType[] = ['full', 'compact', 'title-only', 'multi-event', 'infinite'];
    
    // Start from preferred type and go down if needed
    const startIndex = typesPriority.indexOf(preferredType);
    
    for (let i = startIndex; i < typesPriority.length; i++) {
      const cardType = typesPriority[i];
      
      // Check if this card type is viable
      if (this.isCardTypeViable(cardType, event, availableSlots, totalEventsInCluster)) {
        return cardType;
      }
    }
    
    // Fallback to infinite if nothing else works
    return 'infinite';
  }

  // Check if a card type is viable given constraints
  private isCardTypeViable(
    cardType: CardType,
    event: Event,
    availableSlots: number,
    totalEventsInCluster: number
  ): boolean {
    const cardConfig = this.config.cardConfigs[cardType];
    
    switch (cardType) {
      case 'full':
        // Full cards need substantial content and space
        return availableSlots >= 1 && this.hasSubstantialContent(event);
        
      case 'compact':
        // Compact cards need at least title and some space
        return availableSlots >= 1 && event.title.length > 0;
        
      case 'title-only':
        // Title-only just needs a title and minimal space
        return availableSlots >= 1 && event.title.length > 0;
        
      case 'multi-event':
        // Multi-event needs multiple events and space
        return availableSlots >= 1 && totalEventsInCluster >= 2;
        
      case 'infinite':
        // Infinite is always viable as last resort
        return true;
        
      default:
        return false;
    }
  }

  // Check if event has substantial content for full cards
  private hasSubstantialContent(event: Event): boolean {
    return (
      event.title.length > 10 &&
      event.description &&
      event.description.length > 20
    );
  }

  // Get optimal card type for an event given context
  getOptimalCardType(
    event: Event,
    clusterDensity: 'low' | 'medium' | 'high' | 'extreme'
  ): CardType {
    switch (clusterDensity) {
      case 'low':
        return this.hasSubstantialContent(event) ? 'full' : 'compact';
        
      case 'medium':
        return 'compact';
        
      case 'high':
        return 'title-only';
        
      case 'extreme':
        return 'multi-event';
        
      default:
        return 'full';
    }
  }

  // Determine cluster density based on events vs available space
  assessClusterDensity(
    eventCount: number,
    availableSlots: number
  ): 'low' | 'medium' | 'high' | 'extreme' {
    const ratio = eventCount / Math.max(availableSlots, 1);
    
    if (ratio <= 0.5) return 'low';      // Plenty of space
    if (ratio <= 1.0) return 'medium';   // Fits comfortably
    if (ratio <= 2.0) return 'high';     // Tight fit
    return 'extreme';                    // Overcrowded
  }

  // Get card configuration for a specific type
  getCardConfig(cardType: CardType): CardConfig {
    return this.config.cardConfigs[cardType];
  }

  // Calculate content lines that fit in card height
  calculateContentLines(cardType: CardType, lineHeight: number = 16): {
    titleLines: number;
    descriptionLines: number;
  } {
    const cardConfig = this.getCardConfig(cardType);
    const availableHeight = cardConfig.height - 32; // Account for padding
    const totalLines = Math.floor(availableHeight / lineHeight);
    
    switch (cardType) {
      case 'full':
        return {
          titleLines: Math.min(2, totalLines),
          descriptionLines: Math.max(0, totalLines - 3) // 2 for title, 1 for date
        };
        
      case 'compact':
        return {
          titleLines: Math.min(2, totalLines),
          descriptionLines: Math.max(0, totalLines - 3)
        };
        
      case 'title-only':
        return {
          titleLines: Math.min(2, totalLines),
          descriptionLines: 0
        };
        
      case 'multi-event':
        return {
          titleLines: 1, // Single line per event
          descriptionLines: 0
        };
        
      case 'infinite':
        return {
          titleLines: 1,
          descriptionLines: 0
        };
        
      default:
        return { titleLines: 1, descriptionLines: 0 };
    }
  }

  // Validate card type selection
  validateCardType(cardType: CardType, event: Event): {
    isValid: boolean;
    reason?: string;
  } {
    if (!event.title) {
      return { isValid: false, reason: 'Event must have a title' };
    }

    const cardConfig = this.getCardConfig(cardType);
    if (!cardConfig) {
      return { isValid: false, reason: `Unknown card type: ${cardType}` };
    }

    if (cardType === 'full' && !this.hasSubstantialContent(event)) {
      return { isValid: false, reason: 'Event lacks substantial content for full card' };
    }

    return { isValid: true };
  }
}