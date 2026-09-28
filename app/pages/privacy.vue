<template>
  <div class="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
    <h1 class="text-4xl font-bold font-serif text-primary mb-8">Politique de Confidentialité / Privacy Policy</h1>
    
    <div class="prose prose-lg text-gray-700">
      <p class="text-sm text-gray-500">Dernière mise à jour / Last updated : {{ new Date().toLocaleDateString('fr-CA') }}</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
      <p>Conformément à la <strong>Loi 25 du Québec</strong> sur la protection des renseignements personnels, Histoire et Saveurs s'engage à protéger la confidentialité et la sécurité de vos informations personnelles.</p>
      <p class="text-sm italic text-gray-600">In accordance with Quebec's Law 25 on the protection of personal information, Histoire et Saveurs is committed to protecting the privacy and security of your personal information.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">2. Collecte de données / Data Collection</h2>
      <p>Nous ne collectons que les informations strictement nécessaires au traitement de vos commandes (Nom, courriel, adresse de livraison). Les données de paiement sont traitées de manière sécurisée et chiffrée par <strong>Stripe</strong>. Nous ne stockons jamais vos numéros de carte de crédit.</p>
      <p class="text-sm italic text-gray-600">We only collect information strictly necessary to process your orders (Name, email, shipping address). Payment data is processed securely and encrypted by Stripe. We never store your credit card numbers.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">3. Utilisation des témoins (Cookies) / Use of Cookies</h2>
      <p>Nous utilisons des témoins essentiels pour assurer le fonctionnement du panier d'achats et la sécurité (Cloudflare Turnstile). Les témoins non essentiels nécessitent votre consentement explicite via notre bannière.</p>
      <p class="text-sm italic text-gray-600">We use essential cookies to ensure the functioning of the shopping cart and security. Non-essential cookies require your explicit consent via our banner.</p>

      <h2 class="text-2xl font-bold mt-8 mb-4">4. Responsable de la protection des données / Privacy Officer</h2>
      <p>Conformément aux exigences de la Loi 25, la personne désignée responsable de la protection des renseignements personnels au sein de notre entreprise est :</p>
      <ul class="list-none pl-0 border-l-4 border-secondary pl-4 my-4 bg-beige p-4">
        <li><strong>Nom / Name :</strong> Jean-François Ladurée, DPO</li>
        <li><strong>Titre / Title :</strong> Officier de la protection de la vie privée / Privacy Officer</li>
        <li><strong>Courriel / Email :</strong> <a href="mailto:confidentialite@histoireetsaveurs.com" class="text-primary underline">confidentialite@histoireetsaveurs.com</a></li>
        <li><strong>Téléphone / Phone :</strong> [NUMÉRO DE TÉLÉPHONE À COMPLÉTER]</li>
      </ul>
      <p>Pour toute question concernant vos données, pour demander l'accès à vos renseignements personnels ou pour demander leur suppression, veuillez contacter notre responsable aux coordonnées ci-dessus.</p>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Politique de Confidentialité - Histoire et Saveurs' })
</script>
