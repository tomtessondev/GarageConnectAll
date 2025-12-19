import { prisma } from '@/lib/prisma';

/**
 * Check if customer has all required information
 */
export function hasCompleteInfo(customer: any): boolean {
  return !!(customer.firstName && customer.lastName && customer.email);
}

/**
 * Get missing fields for a customer
 */
export function getMissingFields(customer: any): string[] {
  const missing: string[] = [];
  
  if (!customer.firstName) missing.push('firstName');
  if (!customer.lastName) missing.push('lastName');
  if (!customer.email) missing.push('email');
  
  return missing;
}

/**
 * Format message to request customer information
 */
export function formatInfoRequestMessage(customer: any): string {
  const missing = getMissingFields(customer);
  
  if (missing.length === 0) {
    return ''; // All info is present
  }

  let message = `📋 INFORMATIONS NÉCESSAIRES\n\n`;
  message += `Pour finaliser votre commande, j'ai besoin de :\n\n`;
  
  if (missing.includes('firstName')) {
    message += `• Votre prénom\n`;
  }
  if (missing.includes('lastName')) {
    message += `• Votre nom de famille\n`;
  }
  if (missing.includes('email')) {
    message += `• Votre adresse email\n`;
  }
  
  message += `\n💡 Format:\n`;
  message += `Prénom Nom email@exemple.com\n\n`;
  message += `Exemple: Jean Dupont jean.dupont@gmail.com`;
  
  return message;
}

/**
 * Parse customer info from message
 * Formats acceptés:
 * - "Jean Dupont jean@gmail.com"
 * - "Prénom: Jean, Nom: Dupont, Email: jean@gmail.com"
 */
export function parseCustomerInfo(message: string): {
  firstName?: string;
  lastName?: string;
  email?: string;
} {
  const info: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } = {};

  // Extraire l'email (pattern email)
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    info.email = emailMatch[0].toLowerCase();
  }

  // Supprimer l'email du message pour parser les noms
  let textWithoutEmail = message.replace(info.email || '', '').trim();

  // Supprimer les labels courants
  textWithoutEmail = textWithoutEmail
    .replace(/prénom\s*:?\s*/gi, '')
    .replace(/nom\s*:?\s*/gi, '')
    .replace(/email\s*:?\s*/gi, '')
    .replace(/,/g, ' ')
    .trim();

  // Parser les noms (assume format: Prénom Nom)
  const names = textWithoutEmail.split(/\s+/).filter(n => n.length > 0);
  
  if (names.length >= 2) {
    info.firstName = names[0];
    info.lastName = names.slice(1).join(' ');
  } else if (names.length === 1) {
    info.firstName = names[0];
  }

  return info;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Update customer information
 */
export async function updateCustomerInfo(
  customerId: string,
  info: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }
) {
  // Validate email if provided
  if (info.email && !isValidEmail(info.email)) {
    throw new Error('Format email invalide');
  }

  // Update customer
  return await prisma.customer.update({
    where: { id: customerId },
    data: {
      firstName: info.firstName,
      lastName: info.lastName,
      email: info.email,
    },
  });
}

/**
 * Request and collect customer information flow
 */
export async function collectCustomerInfo(customer: any, message?: string): Promise<{
  complete: boolean;
  response: string;
  updatedCustomer?: any;
}> {
  // Check if all info is present
  if (hasCompleteInfo(customer)) {
    return {
      complete: true,
      response: '',
      updatedCustomer: customer,
    };
  }

  // If no message provided, request info
  if (!message) {
    return {
      complete: false,
      response: formatInfoRequestMessage(customer),
    };
  }

  // Try to parse info from message
  const parsedInfo = parseCustomerInfo(message);

  // Check if we got any valid info
  if (!parsedInfo.firstName && !parsedInfo.lastName && !parsedInfo.email) {
    return {
      complete: false,
      response: `❌ Je n'ai pas pu extraire vos informations.\n\n` +
        formatInfoRequestMessage(customer),
    };
  }

  // Validate email if provided
  if (parsedInfo.email && !isValidEmail(parsedInfo.email)) {
    return {
      complete: false,
      response: `❌ L'adresse email "${parsedInfo.email}" n'est pas valide.\n\n` +
        `Veuillez fournir une adresse email valide.`,
    };
  }

  try {
    // Update customer with new info
    const updatedCustomer = await updateCustomerInfo(customer.id, parsedInfo);

    // Check if we now have all required info
    if (hasCompleteInfo(updatedCustomer)) {
      return {
        complete: true,
        response: `✅ Informations enregistrées !\n\n` +
          `👤 ${updatedCustomer.firstName} ${updatedCustomer.lastName}\n` +
          `📧 ${updatedCustomer.email}\n\n` +
          `Parfait ! Passons à la suite de votre commande.`,
        updatedCustomer,
      };
    } else {
      // Still missing some info
      return {
        complete: false,
        response: `✅ Informations partielles enregistrées.\n\n` +
          formatInfoRequestMessage(updatedCustomer),
        updatedCustomer,
      };
    }
  } catch (error) {
    console.error('Error updating customer info:', error);
    return {
      complete: false,
      response: `❌ Erreur lors de l'enregistrement. Veuillez réessayer.\n\n` +
        formatInfoRequestMessage(customer),
    };
  }
}
