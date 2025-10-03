import type { Event } from '../types';
import type { CardType, CardConfig, LayoutConfig } from './types';

export class CardTypeSelector {
  private config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  selectCardType(
    event: Event,
    availableSlots: number,
    totalEventsInCluster: number,
    preferredType: CardType = 'full'
  ): CardType {
    void totalEventsInCluster;

    const typesPriority: CardType[] = ['full', 'compact', 'title-only'];
    const startIndex = Math.max(0, typesPriority.indexOf(preferredType));

    for (let i = startIndex; i < typesPriority.length; i++) {
      const cardType = typesPriority[i];
      if (this.isCardTypeViable(cardType, event, availableSlots)) {
        return cardType;
      }
    }

    return 'title-only';
  }

  private isCardTypeViable(
    cardType: CardType,
    event: Event,
    availableSlots: number
  ): boolean {
    switch (cardType) {
      case 'full':
        return availableSlots >= 1 && this.hasSubstantialContent(event);
      case 'compact':
      case 'title-only':
        return availableSlots >= 1 && Boolean(event.title);
      default:
        return false;
    }
  }

  private hasSubstantialContent(event: Event): boolean {
    return (
      event.title.length > 10 &&
      Boolean(event.description) &&
      (event.description?.length || 0) > 20
    );
  }

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
      case 'extreme':
        return 'title-only';
      default:
        return 'full';
    }
  }

  assessClusterDensity(
    eventCount: number,
    availableSlots: number
  ): 'low' | 'medium' | 'high' | 'extreme' {
    const ratio = eventCount / Math.max(availableSlots, 1);

    if (ratio <= 0.5) return 'low';
    if (ratio <= 1.0) return 'medium';
    if (ratio <= 2.0) return 'high';
    return 'extreme';
  }

  getCardConfig(cardType: CardType): CardConfig {
    return this.config.cardConfigs[cardType];
  }

  calculateContentLines(cardType: CardType, lineHeight: number = 16): {
    titleLines: number;
    descriptionLines: number;
  } {
    const cardConfig = this.getCardConfig(cardType);
    const availableHeight = cardConfig.height - 32; // Account for padding
    const totalLines = Math.floor(availableHeight / lineHeight);

    switch (cardType) {
      case 'full':
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
      default:
        return { titleLines: 1, descriptionLines: 0 };
    }
  }

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
