# LinkedIn Regulatory Feed Scraper

Agrégateur de posts LinkedIn sur les réglementations européennes (AI Act, GDPR, DMA, etc.).

## 🚀 Lancer le projet

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
# Cloner le repo
git clone https://github.com/titouancv/linkedin-scrapper.git
cd linkedin-scrapper

# Installer les dépendances
npm install
```

### Configuration

Créer un fichier `.env.local` à la racine :

```env
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_custom_search_engine_id
```

Pour obtenir ces clés :

#### 1. Créer une clé API Google

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet (ou sélectionner un projet existant)
3. Dans le menu latéral, aller dans **APIs & Services** → **Library**
4. Rechercher **"Custom Search API"** et l'activer
5. Aller dans **APIs & Services** → **Credentials**
6. Cliquer sur **+ CREATE CREDENTIALS** → **API key**
7. Copier la clé générée → c'est votre `GOOGLE_API_KEY`

> ⚠️ **Sécurité** : Il est recommandé de restreindre la clé à l'API Custom Search uniquement (cliquer sur la clé → Application restrictions)

#### 2. Créer un moteur de recherche personnalisé (CSE)

1. Aller sur [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Cliquer sur **Add** (ou "Ajouter")
3. Configurer le moteur :
   - **Sites to search** : Entrer `linkedin.com/posts/*`
   - **Name** : Donner un nom (ex: "LinkedIn Posts Search")
   - Cocher **"Search the entire web"** si vous voulez aussi chercher hors LinkedIn
4. Cliquer sur **Create**
5. Sur la page de confirmation, cliquer sur **Customize** ou aller dans **Control Panel**
6. Dans **Basics**, copier le **Search engine ID** → c'est votre `GOOGLE_CX`

> 💡 **Quota gratuit** : Google offre 100 requêtes/jour gratuitement. Au-delà, il faut activer la facturation (~$5 pour 1000 requêtes).

### Lancement

```bash
# Mode développement
npm run dev

# Build production
npm run build
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

---

## 🛠 Choix techniques

### Stack

| Technologie      | Justification                                                             |
| ---------------- | ------------------------------------------------------------------------- |
| **Next.js 16**   | Framework React full-stack avec App Router, API routes intégrées, SSR/SSG |
| **TypeScript**   | Typage statique pour une meilleure maintenabilité                         |
| **Tailwind CSS** | Styling rapide et cohérent, classes utilitaires                           |
| **shadcn/ui**    | Composants UI accessibles basés sur Radix                                 |
| **Cheerio**      | Parsing HTML léger côté serveur (alternative à Puppeteer, plus rapide)    |

### Architecture

```
src/
├── app/                    # App Router Next.js
│   ├── api/               # Routes API
│   │   ├── feed/[topic]/  # Récupération des posts par topic
│   │   └── subjects/      # Liste des sujets avec stats
│   ├── feed/[topic]/      # Page feed par sujet
│   └── subjects/          # Page liste des sujets
├── lib/                   # Logique métier
│   ├── googleCustomSearch.ts  # Recherche Google CSE
│   ├── linkedinParser.ts      # Parsing HTML LinkedIn
│   └── radar.ts               # Configuration des topics
└── types/                 # Types TypeScript centralisés
```

### Flux de données

1. **Google Custom Search API** → Recherche `site:linkedin.com/posts "topic"`
2. **Fetch HTML** → Récupération des pages LinkedIn en parallèle (10 simultanées)
3. **Cheerio parsing** → Extraction : auteur, avatar, contenu, date, likes, commentaires, image

---

## ⚠️ Limites connues

### Limitations API

| Limite                                           | Impact                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| **Google CSE** : 100 requêtes/jour (gratuit)     | Limité à ~10 recherches/jour avec pagination        |
| **Google CSE** : Max 100 résultats par recherche | Scroll infini plafonné à 100 posts par topic        |
| **Google Trends** : Pas d'API officielle         | Utilise `google-trends-api` (scraping, peut casser) |

### Limitations techniques

- **LinkedIn HTML** : Structure HTML peut changer, cassant le parsing
- **Rate limiting** : LinkedIn peut bloquer les requêtes trop fréquentes
- **Images** : Certaines images utilisent des URLs temporaires ou protégées
- **Données en temps réel** : Les posts ne sont pas mis à jour automatiquement

---

## 🔮 Pistes d'amélioration

### Court terme

- [ ] **Cache Redis** : Mettre en cache les résultats pour réduire les appels API
- [ ] **Recherche personnalisée** : Permettre aux utilisateurs de chercher n'importe quel topic
- [ ] **Filtres** : Par date, nombre de likes, auteur vérifié
- [ ] **Dark mode** : Support du thème sombre

### Moyen terme

- [ ] **Authentification LinkedIn** : Accès à plus de données via OAuth
- [ ] **Base de données** : PostgreSQL/Supabase pour historique et analytics
- [ ] **Notifications** : Alertes pour nouveaux posts sur topics suivis
- [ ] **Export** : CSV/PDF des posts

### Long terme

- [ ] **NLP/IA** : Résumé automatique des posts, détection de sentiment
- [ ] **Comparaison multi-sources** : Twitter/X, articles de presse
- [ ] **Dashboard analytics** : Évolution des tendances dans le temps
- [ ] **API publique** : Exposer les données en REST/GraphQL
