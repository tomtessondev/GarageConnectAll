import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat';
import { SalesStep } from '@/lib/progress-tracker';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================
// FUNCTION CALLING - TOOLS DEFINITIONS
// ============================================

/**
 * Outils disponibles pour GPT-4
 * GPT-4 peut appeler ces fonctions pour effectuer des actions
 */
export const AVAILABLE_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_tyres',
      description: 'Rechercher des pneus par dimensions avec filtres optionnels',
      parameters: {
        type: 'object',
        properties: {
          width: {
            type: 'number',
            description: 'Largeur du pneu en mm (ex: 205)',
          },
          height: {
            type: 'number',
            description: 'Hauteur du pneu en % de la largeur (ex: 55)',
          },
          diameter: {
            type: 'number',
            description: 'Diamètre de la jante en pouces (ex: 16)',
          },
          category: {
            type: 'string',
            enum: ['budget', 'standard', 'premium'],
            description: 'Catégorie de pneu (optionnel)',
          },
          brand: {
            type: 'string',
            description: 'Marque de pneu (optionnel)',
          },
          page: {
            type: 'number',
            description: 'Numéro de page pour pagination (défaut: 1)',
          },
        },
        required: ['width', 'height', 'diameter'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Ajouter un produit au panier du client',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'ID du produit à ajouter',
          },
          quantity: {
            type: 'number',
            description: 'Quantité à ajouter (1-10)',
            minimum: 1,
            maximum: 10,
          },
        },
        required: ['productId', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'view_cart',
      description: 'Afficher le contenu du panier du client',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_from_cart',
      description: 'Retirer un article spécifique du panier. Utiliser le cartItemId fourni par view_cart.',
      parameters: {
        type: 'object',
        properties: {
          cartItemId: {
            type: 'string',
            description: 'ID de l\'article à retirer (obtenu via view_cart)',
          },
        },
        required: ['cartItemId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_cart_quantity',
      description: 'Modifier la quantité d\'un article dans le panier (augmenter ou diminuer)',
      parameters: {
        type: 'object',
        properties: {
          cartItemId: {
            type: 'string',
            description: 'ID de l\'article à modifier (obtenu via view_cart)',
          },
          quantity: {
            type: 'number',
            description: 'Nouvelle quantité (ex: 4 pour avoir 4 pneus)',
            minimum: 1,
            maximum: 10,
          },
        },
        required: ['cartItemId', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_cart',
      description: 'Vider complètement le panier du client (retirer TOUS les articles)',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'replace_product_in_cart',
      description: 'Remplacer un produit dans le panier par un autre (ex: remplacer Budget par Premium)',
      parameters: {
        type: 'object',
        properties: {
          oldCartItemId: {
            type: 'string',
            description: 'ID de l\'article à remplacer (obtenu via view_cart)',
          },
          newProductId: {
            type: 'string',
            description: 'ID du nouveau produit (obtenu via search_tyres ou compare_products)',
          },
          quantity: {
            type: 'number',
            description: 'Quantité du nouveau produit (optionnel, garde la quantité actuelle si non spécifié)',
            minimum: 1,
            maximum: 10,
          },
        },
        required: ['oldCartItemId', 'newProductId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_progress',
      description: 'Mettre à jour l\'étape de progression du client dans le tunnel de vente',
      parameters: {
        type: 'object',
        properties: {
          step: {
            type: 'string',
            enum: ['greeting', 'search', 'results', 'selection', 'cart', 'checkout', 'payment', 'confirmation'],
            description: 'Nouvelle étape de progression',
          },
        },
        required: ['step'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_details',
      description: 'Obtenir les détails complets d\'un produit',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'ID du produit',
          },
        },
        required: ['productId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_brands',
      description: 'Obtenir la liste des marques disponibles pour une dimension',
      parameters: {
        type: 'object',
        properties: {
          width: {
            type: 'number',
            description: 'Largeur',
          },
          height: {
            type: 'number',
            description: 'Hauteur',
          },
          diameter: {
            type: 'number',
            description: 'Diamètre',
          },
        },
        required: ['width', 'height', 'diameter'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Vérifier le statut d\'une commande',
      parameters: {
        type: 'object',
        properties: {
          orderNumber: {
            type: 'string',
            description: 'Numéro de commande (format: GC-YYYY-XXXXXX)',
          },
        },
        required: ['orderNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_orders',
      description: 'Lister les commandes du client',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Nombre maximum de commandes à retourner (défaut: 5)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_products',
      description: 'Comparer plusieurs produits côte à côte',
      parameters: {
        type: 'object',
        properties: {
          productIds: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Liste des IDs de produits à comparer (2-4 produits)',
            minItems: 2,
            maxItems: 4,
          },
        },
        required: ['productIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Créer une commande et générer le lien de paiement Stripe sécurisé. NE PAS inventer de données - demander TOUTES les infos au client avant.',
      parameters: {
        type: 'object',
        properties: {
          deliveryAddress: {
            type: 'string',
            description: 'Adresse de livraison complète fournie par le client (format: Rue, Ville, Code postal)',
          },
          email: {
            type: 'string',
            description: 'Email réel du client pour la facture (PAS d\'exemple comme tom@example.com)',
          },
          firstName: {
            type: 'string',
            description: 'Prénom réel du client (PAS d\'exemple comme Tom)',
          },
          lastName: {
            type: 'string',
            description: 'Nom réel du client (PAS d\'exemple comme Dupont)',
          },
        },
        required: ['deliveryAddress', 'email', 'firstName', 'lastName'],
      },
    },
  },
];

/**
 * Interface pour le résultat d'un appel de fonction
 */
export interface ToolCallResult {
  toolCallId: string;
  functionName: string;
  result: unknown;
  success: boolean;
  error?: string;
}

/**
 * Appel GPT-4 avec Function Calling
 * C'est la fonction centrale de l'architecture AI-first
 */
export async function getChatCompletionWithTools(
  messages: ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    currentStep?: SalesStep;
    model?: string; // OPTIMIZATION: Allow model selection (gpt-4 or gpt-4o-mini)
  }
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  try {
    const completion = await openai.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages,
      tools: AVAILABLE_TOOLS,
      tool_choice: 'auto', // GPT-4 décide s'il doit utiliser un outil
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
    });

    return completion;
  } catch (error) {
    console.error('❌ OpenAI API Error with tools:', error);
    throw new Error('Failed to get AI response with tools');
  }
}

/**
 * Formater les résultats des tool calls pour le prochain message à GPT-4
 */
export function formatToolResults(
  results: ToolCallResult[]
): ChatCompletionMessageParam[] {
  return results.map(result => ({
    role: 'tool' as const,
    tool_call_id: result.toolCallId,
    content: result.success 
      ? JSON.stringify(result.result)
      : JSON.stringify({ error: result.error }),
  }));
}

/**
 * Vérifier si GPT-4 a demandé des tool calls
 */
export function hasToolCalls(
  completion: OpenAI.Chat.Completions.ChatCompletion
): boolean {
  return !!(completion.choices[0]?.message?.tool_calls?.length);
}

/**
 * Extraire les tool calls de la réponse GPT-4
 */
export function extractToolCalls(
  completion: OpenAI.Chat.Completions.ChatCompletion
): OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] {
  return completion.choices[0]?.message?.tool_calls || [];
}

/**
 * Get chat completion from GPT-4
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    throw new Error('Failed to get AI response');
  }
}

/**
 * Extract tyre dimensions from user message
 */
export async function extractDimensions(
  message: string
): Promise<{ width: number; height: number; diameter: number } | null> {
  try {
    const prompt = `
Extract tyre dimensions from this message: "${message}"

Tyre dimensions are in format: Width/Height R Diameter (e.g., 205/55R16)
- Width: 3 digits (e.g., 205)
- Height: 2 digits (e.g., 55)
- Diameter: 2 digits (e.g., 16)

Respond ONLY with JSON format:
{"width": number, "height": number, "diameter": number}

If no valid dimensions found, respond with:
{"width": null, "height": null, "diameter": null}
`;

    const response = await getChatCompletion([
      { role: 'system', content: 'You are a tyre dimension extractor. Only respond with JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0, maxTokens: 100 });

    // Nettoyer la réponse pour enlever les backticks markdown si présents
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanResponse);
    
    if (parsed.width && parsed.height && parsed.diameter) {
      return {
        width: parseInt(parsed.width),
        height: parseInt(parsed.height),
        diameter: parseInt(parsed.diameter)
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting dimensions:', error);
    return null;
  }
}

/**
 * Detect user intent from message
 */
export async function detectIntent(
  message: string,
  conversationContext?: Record<string, unknown>
): Promise<{
  action: string;
  parameters?: Record<string, unknown>;
  confidence: number;
}> {
  try {
    const prompt = `
Analyze this customer message and detect their intent: "${message}"

${conversationContext ? `Context: ${JSON.stringify(conversationContext)}` : ''}

Available actions:
- search_tyres: Customer wants to search for tyres
- select_product: Customer is selecting a product (says "budget", "standard", "premium", or number)
- add_to_cart: Customer wants to add item to cart
- view_cart: Customer wants to see their cart
- checkout: Customer wants to complete purchase
- view_orders: Customer wants to see their orders
- show_rules: Customer asks for rules/conditions
- show_tutorial: Customer asks how it works
- request_help: Customer needs help/has questions
- leave_review: Customer wants to leave a review
- general_chat: General conversation

IMPORTANT: If the last action was "search_results" and customer responds with a category name (budget/standard/premium) or number, the action should be "select_product".

Respond ONLY with JSON:
{
  "action": "action_name",
  "parameters": {},
  "confidence": 0.0-1.0
}
`;

    const response = await getChatCompletion([
      { role: 'system', content: 'You are an intent detection system. Only respond with JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.3, maxTokens: 150 });

    // Nettoyer la réponse pour enlever les backticks markdown si présents
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error('Error detecting intent:', error);
    return {
      action: 'general_chat',
      confidence: 0.5
    };
  }
}

export default openai;
