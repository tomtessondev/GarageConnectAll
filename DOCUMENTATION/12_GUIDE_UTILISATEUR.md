# 12 - GUIDE UTILISATEUR FINAL

[← Retour à l'index](./00_INDEX.md)

---

## 📑 TABLE DES MATIÈRES

1. [Pour les Clients WhatsApp](#1-pour-les-clients-whatsapp)
2. [Parcours d'Achat Complet](#2-parcours-dachat-complet)
3. [Questions Fréquentes](#3-questions-fréquentes)
4. [Règles et Conditions](#4-règles-et-conditions)

---

## 1. POUR LES CLIENTS WHATSAPP

### 1.1 Comment Démarrer

**Étape 1 : Ouvrir WhatsApp**
- Ouvrez l'application WhatsApp sur votre téléphone
- Aucune installation supplémentaire nécessaire

**Étape 2 : Envoyer un Message**
- Numéro WhatsApp : **[Numéro configuré]**
- Premier message : Tapez simplement "Bonjour"
- Le bot vous répondra automatiquement

**Étape 3 : Suivre les Instructions**
- Le bot vous guidera étape par étape
- Répondez naturellement en français
- Posez toutes vos questions

### 1.2 Que Peut Faire le Bot ?

**Rechercher des Pneus**
- Vous aide à trouver les pneus adaptés
- Compare les prix et qualités
- Recommande selon votre budget

**Gérer Votre Panier**
- Ajouter/retirer des articles
- Voir le total
- Modifier les quantités

**Passer Commande**
- Collecte vos informations
- Génère un lien de paiement sécurisé
- Envoie confirmation immédiate

**Suivre Votre Commande**
- Statut en temps réel
- QR code pour le retrait
- Historique d'achats

**Répondre à Vos Questions**
- Horaires d'ouverture
- Conditions de vente
- Conseils techniques

---

## 2. PARCOURS D'ACHAT COMPLET

### 2.1 Étape 1 : Recherche de Pneus

**Comment Trouver Vos Dimensions ?**

Les dimensions sont inscrites sur le flanc de vos pneus actuels :

```
Exemple : 205/55R16

205 = Largeur en millimètres
55  = Hauteur (ratio)
R   = Radial (type)
16  = Diamètre de la jante en pouces
```

**Conversation Type :**
```
👤 Vous : "Je cherche des pneus 205/55R16"

🤖 Bot : "🔍 Recherche en cours...

J'ai trouvé 3 excellentes options pour 205/55R16 :

💰 BUDGET - 95€/pneu
Continental EcoContact
✓ Bon rapport qualité/prix
✓ Fiable pour usage quotidien

⭐ STANDARD - 135€/pneu ✨ Recommandé
Michelin Energy Saver
✓ Économie de carburant
✓ Longue durée de vie
✓ Adhérence optimale

💎 PREMIUM - 165€/pneu
Bridgestone Turanza
✓ Performance maximale
✓ Confort de conduite supérieur
✓ Technologie avancée

Quelle catégorie vous intéresse ?"
```

### 2.2 Étape 2 : Sélection et Quantité

**Choisir la Catégorie :**
```
👤 Vous : "Standard"

🤖 Bot : "✅ Excellent choix !

Michelin Energy Saver
205/55R16
Prix : 135€/pneu

Combien de pneus souhaitez-vous ?
• Généralement 2 pneus (train avant/arrière)
• Ou 4 pneus (jeu complet recommandé)

Répondez avec le nombre (ex: 4)"
```

**Indiquer la Quantité :**
```
👤 Vous : "4"

🤖 Bot : "✅ Ajouté au panier !

Michelin Energy Saver
4x 135€ = 540€

📋 Votre panier :
• 4x Michelin Energy Saver 205/55R16
• Prix unitaire : 135€
• Sous-total : 540€

Options disponibles :
• Continuer mes achats
• Voir mon panier complet
• Passer commande

Que souhaitez-vous faire ?"
```

### 2.3 Étape 3 : Validation du Panier

**Voir le Panier :**
```
👤 Vous : "Voir mon panier"

🤖 Bot : "🛒 VOTRE PANIER

Articles :
1. Michelin Energy Saver 205/55R16
   Quantité : 4
   Prix unitaire : 135€
   Sous-total : 540€

━━━━━━━━━━━━━━━━
Sous-total : 540,00€
Frais de service : 0,00€
TOTAL : 540,00€
━━━━━━━━━━━━━━━━

⚠️ Votre panier expire dans 23h45

Options :
• Passer commande
• Modifier quantités
• Vider le panier"
```

### 2.4 Étape 4 : Informations de Livraison

**Passer Commande :**
```
👤 Vous : "Passer commande"

🤖 Bot : "📋 INFORMATIONS DE LIVRAISON

Pour finaliser votre commande, j'ai besoin de :

1️⃣ Votre adresse complète
Format : Numéro, Rue, Ville, Code postal

Exemple : 15 Rue des Palmiers, Pointe-à-Pitre, 97110"
```

**Fournir l'Adresse :**
```
👤 Vous : "25 Avenue de la Liberté, Pointe-à-Pitre, 97110"

🤖 Bot : "✅ Adresse enregistrée

25 Avenue de la Liberté
Pointe-à-Pitre, 97110

2️⃣ Votre email (pour la facture)
Exemple : prenom.nom@email.com"
```

**Fournir l'Email :**
```
👤 Vous : "jean.martin@email.com"

🤖 Bot : "✅ Email enregistré

3️⃣ Prénom et Nom
Exemple : Jean Martin"
```

**Fournir le Nom :**
```
👤 Vous : "Jean Martin"

🤖 Bot : "✅ Informations complètes !

📦 RÉCAPITULATIF DE COMMANDE

Client : Jean Martin
Email : jean.martin@email.com
Livraison : 25 Avenue de la Liberté
            Pointe-à-Pitre, 97110

Articles :
• 4x Michelin Energy Saver 205/55R16

TOTAL : 540,00€

✅ Confirmez-vous cette commande ?
Répondez OUI pour continuer"
```

### 2.5 Étape 5 : Paiement

**Confirmation :**
```
👤 Vous : "Oui"

🤖 Bot : "✅ Commande créée !

Numéro : GC-2024-001234

💳 PAIEMENT SÉCURISÉ

Cliquez sur le lien ci-dessous pour payer en toute sécurité avec Stripe :

🔗 https://checkout.stripe.com/pay/...

Options de paiement :
✓ Carte bancaire (Visa, Mastercard)
✓ Paiement en 4x sans frais (>100€)

🔒 Paiement 100% sécurisé par Stripe
Vos données sont protégées

⏱️ Lien valide pendant 30 minutes"
```

**Sur la Page Stripe :**
- Interface de paiement professionnelle
- Formulaire sécurisé
- Options : Paiement immédiat ou en 4x
- Confirmation instantanée

### 2.6 Étape 6 : Confirmation et QR Code

**Après Paiement Réussi :**
```
🤖 Bot : "✅ PAIEMENT CONFIRMÉ !

Merci Jean Martin pour votre achat !

Commande : GC-2024-001234
Montant payé : 540,00€
Date : 17/12/2024 à 14:32

📱 QR CODE DE RETRAIT

[IMAGE: QR Code]

📦 RETRAIT DE VOTRE COMMANDE

Adresse :
GarageConnect
15 Zone Industrielle Jarry
97122 Baie-Mahault

Horaires :
Lundi - Samedi : 8h - 18h
Dimanche : Fermé

⚠️ IMPORTANT :
1. Présentez ce QR code à l'entrepôt
2. Votre commande sera prête sous 24-48h
3. Conservez ce message

📧 Facture envoyée par email
📲 Vous recevrez un SMS quand c'est prêt

Questions ? Répondez à ce message !"
```

### 2.7 Étape 7 : Retrait à l'Entrepôt

**À l'Entrepôt :**
1. Présentez votre téléphone avec le QR code
2. Le personnel scanne le code
3. Vérification automatique
4. Remise des pneus
5. Signature du bon de retrait

**Après Retrait :**
```
🤖 Bot : "✅ Commande GC-2024-001234 retirée !

Merci d'avoir choisi GarageConnect 🚗

Profitez bien de vos nouveaux pneus Michelin !

💡 Besoin de montage ?
Nos partenaires garagistes peuvent vous aider.
Demandez-moi les coordonnées !"
```

### 2.8 Étape 8 : Avis Client (J+7)

**7 Jours Après Retrait :**
```
🤖 Bot : "Bonjour Jean ! 👋

Comment s'est passée votre expérience avec vos nouveaux pneus Michelin ?

⭐ Notez votre achat de 1 à 5 étoiles :
1 ⭐ - Très insatisfait
2 ⭐⭐ - Insatisfait
3 ⭐⭐⭐ - Correct
4 ⭐⭐⭐⭐ - Satisfait
5 ⭐⭐⭐⭐⭐ - Très satisfait

Répondez avec le nombre d'étoiles (1-5)"
```

**Laisser un Avis :**
```
👤 Vous : "5"

🤖 Bot : "⭐⭐⭐⭐⭐ Merci pour votre note !

Souhaitez-vous ajouter un commentaire ?
(Optionnel - partagez votre expérience)"
```

```
👤 Vous : "Excellent service, pneus de qualité, retrait rapide !"

🤖 Bot : "✨ Merci beaucoup Jean !

Votre avis nous aide à nous améliorer.

🎁 En remerciement, bénéficiez de -10% sur votre prochaine commande avec le code : MERCI10

Valable 30 jours.

À bientôt sur GarageConnect ! 🚗"
```

---

## 3. QUESTIONS FRÉQUENTES

### 3.1 Avant l'Achat

**Q : Comment connaître mes dimensions de pneus ?**
R : Regardez le flanc de vos pneus actuels. Vous verrez des chiffres comme "205/55R16". C'est votre dimension.

**Q : Quelle catégorie choisir ?**
R : 
- **Budget** : Usage occasionnel, petit budget
- **Standard** : Usage quotidien, bon compromis (recommandé)
- **Premium** : Performance maximale, usage intensif

**Q : Combien de pneus dois-je acheter ?**
R : 
- Minimum 2 pneus (même train)
- Idéal : 4 pneus (sécurité optimale)
- Le bot vous conseillera

**Q : Les prix incluent-ils le montage ?**
R : Non, le montage est à prévoir chez un garagiste. Nous pouvons vous recommander des partenaires.

**Q : Y a-t-il une garantie ?**
R : Oui, garantie constructeur appliquée selon la marque (généralement 2-5 ans).

### 3.2 Pendant l'Achat

**Q : Puis-je modifier mon panier ?**
R : Oui, avant la validation finale. Dites "modifier panier" au bot.

**Q : Combien de temps ai-je pour payer ?**
R : Le lien de paiement est valide 30 minutes. Votre panier est réservé 24h.

**Q : Le paiement est-il sécurisé ?**
R : Oui, 100% sécurisé par Stripe (leader mondial). Nous ne stockons pas vos données bancaires.

**Q : Puis-je payer en plusieurs fois ?**
R : Oui, paiement en 4x sans frais disponible pour les commandes >100€.

**Q : Que se passe-t-il si le paiement échoue ?**
R : Vous recevrez un nouveau lien. Votre panier reste actif 24h.

### 3.3 Après l'Achat

**Q : Quand puis-je retirer ma commande ?**
R : Sous 24-48h. Vous recevrez un SMS de confirmation.

**Q : Que faire si je perds mon QR code ?**
R : Demandez au bot "mon QR code" ou "ma commande". Il vous le renverra.

**Q : Puis-je me faire livrer ?**
R : Actuellement, retrait uniquement. Livraison bientôt disponible.

**Q : Puis-je annuler ma commande ?**
R : Oui, avant préparation (sous 12h). Contactez le bot : "annuler commande".

**Q : Comment obtenir ma facture ?**
R : Envoyée automatiquement par email après paiement.

### 3.4 Problèmes Techniques

**Q : Le bot ne répond pas**
R : 
1. Vérifiez votre connexion internet
2. Réessayez dans quelques minutes
3. Horaires : Lundi-Samedi 8h-18h

**Q : Je n'ai pas reçu le QR code**
R : Tapez "mon QR code" ou "ma commande [numéro]"

**Q : Le lien de paiement ne fonctionne pas**
R : Vérifiez qu'il n'a pas expiré (30 min). Demandez un nouveau lien au bot.

**Q : J'ai payé mais pas de confirmation**
R : Patientez 2-3 minutes. Si problème persiste, contactez avec votre numéro de commande.

---

## 4. RÈGLES ET CONDITIONS

### 4.1 Commande

**Validation :**
- Commande validée après paiement confirmé
- Email de confirmation automatique
- Facture envoyée par email

**Modification :**
- Possible avant préparation (12h)
- Contactez via WhatsApp
- Remboursement si annulation validée

**Prix :**
- Prix affiché = prix final
- Pas de frais cachés
- Paiement sécurisé Stripe

### 4.2 Paiement

**Méthodes Acceptées :**
- Carte bancaire (Visa, Mastercard, Amex)
- Paiement en 4x sans frais (>100€)

**Sécurité :**
- Cryptage SSL
- Conformité PCI DSS
- Aucune donnée bancaire stockée

**Facturation :**
- Facture électronique par email
- Détails TVA inclus
- Archivage automatique

### 4.3 Retrait

**Lieu :**
```
GarageConnect
15 Zone Industrielle Jarry
97122 Baie-Mahault, Guadeloupe
```

**Horaires :**
- Lundi - Samedi : 8h00 - 18h00
- Dimanche : Fermé
- Jours fériés : Fermé

**Procédure :**
1. Commande prête sous 24-48h
2. SMS de confirmation
3. Présentez QR code
4. Vérification d'identité
5. Remise des pneus
6. Signature bon de retrait

**Important :**
- QR code obligatoire
- Pièce d'identité requise
- Retrait par le titulaire ou personne mandatée

### 4.4 Retours et Garantie

**Conditions de Retour :**
- Pneus non montés : 14 jours
- État d'origine requis
- Avec facture
- Frais de retour : client

**Garantie :**
- Garantie constructeur appliquée
- Défauts de fabrication couverts
- Usure normale non couverte
- Demande via WhatsApp

**Remboursement :**
- Délai : 5-7 jours ouvrés
- Même moyen de paiement
- Notification par email

### 4.5 Service Client

**Contact WhatsApp :**
- Numéro : [Configuré]
- Disponibilité : Lun-Sam 8h-18h
- Réponse sous 2h en journée

**Email :**
- contact@garageconnect.gp
- Réponse sous 24h ouvrées

**Urgence :**
- Problème commande : WhatsApp
- Problème paiement : WhatsApp
- Autre : Email

---

## 💡 CONSEILS PRATIQUES

### Avant d'Acheter
✓ Vérifiez 2x vos dimensions
✓ Comparez les catégories
✓ Prévoyez le montage (50-80€)
✓ Vérifiez votre budget

### Pendant l'Achat
✓ Adresse complète et exacte
✓ Email valide (facture)
✓ Paiement dans les 30 min
✓ Sauvegardez le QR code

### Après l'Achat
✓ Conservez votre QR code
✓ Notez l'adresse de retrait
✓ Respectez les horaires
✓ Apportez pièce d'identité

---

## 🎯 AVANTAGES GARAGECONNECT

✅ **Simple** - Tout via WhatsApp, aucune app
✅ **Rapide** - Commande en 5 minutes
✅ **Sécurisé** - Paiement Stripe protégé
✅ **Transparent** - Prix clairs, pas de surprise
✅ **Disponible** - Bot 24/7, support 6j/7
✅ **Qualité** - Grandes marques garanties
✅ **Pratique** - Retrait rapide en 24-48h

---

[← Retour à l'index](./00_INDEX.md)
