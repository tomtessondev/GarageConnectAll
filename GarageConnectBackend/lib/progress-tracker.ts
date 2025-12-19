/**
 * Progress Tracker - Système de suivi de progression client dans le tunnel de vente
 */

export interface ConversationContext {
  // Recherche en cours
  searchDimensions?: string;
  searchResults?: Array<{ id: string; [key: string]: unknown }>;
  
  // Sélection
  selectedProductId?: string;
  selectedCategory?: string;
  
  // Panier
  cartItems?: Array<{
    id: string;
    quantity: number;
    product: {
      priceRetail: number | string;
      [key: string]: unknown;
    };
  }>;
  cartTotal?: number;
  
  // Checkout
  deliveryInfoComplete?: boolean;
  
  // Payment
  paymentIntentId?: string;
  
  // Autres
  hasViewedDetails?: boolean;
  lastActivity?: string;
  [key: string]: unknown;
}

export enum SalesStep {
  GREETING = 'greeting',           // 0% - Accueil initial
  SEARCH = 'search',               // 15% - Recherche de dimensions
  RESULTS = 'results',             // 30% - Résultats affichés
  SELECTION = 'selection',         // 45% - Produit sélectionné
  CART = 'cart',                   // 60% - Article dans le panier
  CHECKOUT = 'checkout',           // 75% - Validation des informations
  PAYMENT = 'payment',             // 90% - Paiement en cours
  CONFIRMATION = 'confirmation'    // 100% - Commande confirmée
}

interface StepInfo {
  key: SalesStep;
  label: string;
  progress: number;
  icon: string;
}

const STEPS: StepInfo[] = [
  { key: SalesStep.GREETING, label: 'Accueil', progress: 0, icon: '👋' },
  { key: SalesStep.SEARCH, label: 'Recherche', progress: 15, icon: '🔍' },
  { key: SalesStep.RESULTS, label: 'Résultats', progress: 30, icon: '📋' },
  { key: SalesStep.SELECTION, label: 'Sélection', progress: 45, icon: '✓' },
  { key: SalesStep.CART, label: 'Panier', progress: 60, icon: '🛒' },
  { key: SalesStep.CHECKOUT, label: 'Infos', progress: 75, icon: '📝' },
  { key: SalesStep.PAYMENT, label: 'Paiement', progress: 90, icon: '💳' },
  { key: SalesStep.CONFIRMATION, label: 'Confirmé', progress: 100, icon: '✅' },
];

/**
 * Génère une barre de progression visuelle
 */
export function generateProgressBar(currentStep: SalesStep): string {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  const currentStepInfo = STEPS[currentIndex];
  const nextStep = STEPS[currentIndex + 1];

  // Barre visuelle avec points
  const bar = STEPS.map((step, index) => {
    if (index < currentIndex) return '●'; // Complété
    if (index === currentIndex) return '◉'; // En cours
    return '○'; // À venir
  }).join('━');

  const progressEmoji = getProgressEmoji(currentStepInfo.progress);

  return `╔══════════════╗
║  PROGRESSION : ${currentStepInfo.progress}%  ${progressEmoji}
╠══════════════╣
  ${bar}
  ${currentStepInfo.icon} ${currentStepInfo.label}
╚══════════════╝
${nextStep ? `➡️  Prochaine étape : ${nextStep.icon} ${nextStep.label}` : '🎉 Parcours terminé !'}

`;
}

/**
 * Version simplifiée de la progression (pour messages courts)
 */
export function generateSimpleProgress(currentStep: SalesStep): string {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  const currentStepInfo = STEPS[currentIndex];
  const stepNumber = currentIndex + 1;
  const totalSteps = STEPS.length;

  return `[${stepNumber}/${totalSteps}] ${currentStepInfo.icon} ${currentStepInfo.label}`;
}

/**
 * Emoji selon le niveau de progression
 */
function getProgressEmoji(progress: number): string {
  if (progress === 0) return '🏁';
  if (progress < 30) return '🚶';
  if (progress < 60) return '🏃';
  if (progress < 90) return '🚀';
  return '🎉';
}

/**
 * Obtenir le prochain step logique
 */
export function getNextStep(currentStep: SalesStep): SalesStep | null {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  return STEPS[currentIndex + 1]?.key || null;
}

/**
 * Vérifier si le client peut avancer à cette étape
 */
export function canAdvanceToStep(
  currentStep: SalesStep,
  targetStep: SalesStep,
  context: ConversationContext
): boolean {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);
  const targetIndex = STEPS.findIndex(s => s.key === targetStep);

  // Ne peut pas reculer drastiquement (sauf cas spéciaux)
  if (targetIndex < currentIndex - 1) return false;

  // Vérifications selon l'étape cible
  switch (targetStep) {
    case SalesStep.RESULTS:
      return !!context.searchDimensions; // Doit avoir fait une recherche

    case SalesStep.SELECTION:
      return (context.searchResults?.length ?? 0) > 0; // Doit avoir des résultats

    case SalesStep.CART:
      return context.selectedProductId != null; // Doit avoir sélectionné un produit

    case SalesStep.CHECKOUT:
      return (context.cartItems?.length ?? 0) > 0; // Doit avoir des items dans le panier

    case SalesStep.PAYMENT:
      return context.deliveryInfoComplete === true; // Infos de livraison complètes

    case SalesStep.CONFIRMATION:
      return context.paymentIntentId != null; // Doit avoir un paiement en cours

    default:
      return true; // Les autres étapes sont toujours accessibles
  }
}

/**
 * Générer des suggestions proactives selon l'étape
 */
export function getProactiveSuggestions(
  currentStep: SalesStep,
  context: ConversationContext
): string[] {
  const suggestions: string[] = [];

  switch (currentStep) {
    case SalesStep.GREETING:
      suggestions.push("💡 Astuce : Dis-moi juste les dimensions de tes pneus pour commencer !");
      break;

    case SalesStep.RESULTS:
      if ((context.searchResults?.length ?? 0) > 3) {
        suggestions.push("🔍 Tu peux affiner par marque ou prix si tu veux");
      }
      if (!context.hasViewedDetails) {
        suggestions.push("💡 Demande 'détails' pour comparer les caractéristiques");
      }
      break;

    case SalesStep.SELECTION:
      suggestions.push("💬 Besoin de conseils sur la quantité ? Demande-moi !");
      break;

    case SalesStep.CART:
      if (context.cartTotal && context.cartTotal > 400) {
        suggestions.push("💳 Paiement en 4x sans frais disponible pour ce montant !");
      }
      if (context.cartItems?.length === 1 && context.cartItems[0].quantity === 2) {
        suggestions.push("🤔 Info : Un jeu complet de 4 pneus assure une meilleure sécurité");
      }
      break;

    case SalesStep.CHECKOUT:
      suggestions.push("⏱️ Plus que quelques infos et c'est bouclé !");
      break;

    case SalesStep.PAYMENT:
      suggestions.push("🔒 Paiement 100% sécurisé par Stripe");
      break;
  }

  return suggestions;
}

/**
 * Générer un résumé du panier (footer)
 */
export function getCartSummary(cartItems: ConversationContext['cartItems']): string {
  if (!cartItems || cartItems.length === 0) return '';

  const itemCount = cartItems.length;
  const total = cartItems.reduce((sum, item) => {
    return sum + (Number(item.product.priceRetail) * item.quantity);
  }, 0);

  return `
───────────
🛒 Panier : ${itemCount} article(s) • ${total.toFixed(2)}€
───────────`;
}

/**
 * Obtenir les actions rapides selon l'étape
 */
export function getQuickActions(currentStep: SalesStep, context: ConversationContext): string[] {
  const actions: Record<SalesStep, string[]> = {
    [SalesStep.GREETING]: [
      "🔍 Rechercher des pneus",
      "📦 Mes commandes",
      "❓ Comment ça marche ?"
    ],
    [SalesStep.SEARCH]: [
      "❓ Où trouver les dimensions ?",
      "📋 Exemples de dimensions"
    ],
    [SalesStep.RESULTS]: [
      "1️⃣ Voir Budget",
      "2️⃣ Voir Standard",
      "3️⃣ Voir Premium",
      "🔍 Plus de filtres"
    ],
    [SalesStep.SELECTION]: [
      "✅ Ajouter 2 pneus",
      "✅ Ajouter 4 pneus",
      "🔙 Voir d'autres modèles"
    ],
    [SalesStep.CART]: [
      "✅ Valider ma commande",
      "➕ Ajouter un article",
      "✏️ Modifier quantités",
      "🛒 Voir détails panier"
    ],
    [SalesStep.CHECKOUT]: [
      "💳 Passer au paiement",
      "🔙 Retour au panier"
    ],
    [SalesStep.PAYMENT]: [
      "❓ Modes de paiement",
      "🔐 Sécurité"
    ],
    [SalesStep.CONFIRMATION]: [
      "📦 Voir ma commande",
      "🔍 Commander d'autres pneus",
      "⭐ Laisser un avis"
    ]
  };

  return actions[currentStep] || [];
}

/**
 * Format complet du message avec progression
 */
export function formatMessageWithProgress(
  message: string,
  currentStep: SalesStep,
  context: ConversationContext,
  options: {
    showFullBar?: boolean;
    showSuggestions?: boolean;
    showQuickActions?: boolean;
    showCartSummary?: boolean;
  } = {}
): string {
  const {
    showFullBar = false, // CHANGED: Désactivé par défaut pour éviter doublons
    showSuggestions = false, // CHANGED: L'IA gère les suggestions
    showQuickActions = false,
    showCartSummary = false, // CHANGED: Désactivé par défaut pour éviter doublons
  } = options;

  let fullMessage = '';

  // Barre de progression
  if (showFullBar) {
    fullMessage += generateProgressBar(currentStep) + '\n';
  } else {
    fullMessage += generateSimpleProgress(currentStep) + '\n\n';
  }

  // Message principal
  fullMessage += message;

  // Suggestions proactives
  if (showSuggestions) {
    const suggestions = getProactiveSuggestions(currentStep, context);
    if (suggestions.length > 0) {
      fullMessage += '\n\n' + suggestions.join('\n');
    }
  }

  // Actions rapides
  if (showQuickActions) {
    const actions = getQuickActions(currentStep, context);
    if (actions.length > 0) {
      fullMessage += '\n\n⚡ Actions rapides :\n' + actions.join('\n');
    }
  }

  // Résumé du panier
  if (showCartSummary && context.cartItems) {
    fullMessage += getCartSummary(context.cartItems);
  }

  return fullMessage;
}
