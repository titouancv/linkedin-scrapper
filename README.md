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

### Architecture de récupération des données

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Google Trends  │────▶│   Scores Popularité  │────▶│                 │
│       API       │     │   (cache 24h)        │     │                 │
└─────────────────┘     └──────────────────────┘     │                 │
                                                      │   Interface    │
┌─────────────────┐     ┌──────────────────────┐     │   Utilisateur   │
│ Google Custom   │────▶│  URLs Posts LinkedIn │     │                 │
│   Search API    │     └──────────────────────┘     │                 │
└─────────────────┘              │                   │                 │
                                 ▼                   │                 │
┌─────────────────┐     ┌──────────────────────┐     │                 │
│ Pages LinkedIn  │────▶│  Parsing HTML        │────▶│                 │
│ (fetch direct)  │     │  (Cheerio)           │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

### Flux de données

1. **Google Custom Search API** → Recherche `site:linkedin.com/posts "topic"`
2. **Fetch HTML** → Récupération des pages LinkedIn en parallèle (10 simultanées)
3. **Cheerio parsing** → Extraction : auteur, avatar, contenu, date, likes, commentaires, image

---

## 📊 APIs Utilisées

### 1. Google Trends API (`google-trends-api`)

**Fichier** : `src/lib/googleTrends.ts`

**Fonctionnement** :

- Utilise la librairie npm `google-trends-api` (non-officielle)
- Compare les mots-clés par lots de 5 (limite de l'API)
- Calcule un score moyen sur les 30 derniers jours
- Résultats mis en cache 24h côté serveur

| ✅ Avantages                      | ❌ Inconvénients                                |
| --------------------------------- | ----------------------------------------------- |
| Gratuit                           | API **non-officielle** (peut casser)            |
| Données réelles Google            | **Rate limiting agressif** → erreur 302 CAPTCHA |
| Comparaison relative entre sujets | Fonctionne **mal côté serveur** (IP bloquée)    |
| Scores normalisés 0-100           | Latence élevée (~1s par batch)                  |

**🔧 Solutions d'amélioration** :

| Solution                              | Complexité | Coût      |
| ------------------------------------- | ---------- | --------- |
| **Exécuter côté client**              | Moyenne    | Gratuit   |
| **SerpApi** (Google Trends proxy)     | Faible     | ~$50/mois |
| **Proxy rotatif** (Bright Data, etc.) | Moyenne    | ~$15/mois |
| **Scores statiques pré-calculés**     | Faible     | Gratuit   |
| **Cache Redis persistant**            | Moyenne    | ~$5/mois  |

---

### 2. Google Custom Search API

**Fichier** : `src/lib/googleCustomSearch.ts`

**Fonctionnement** :

- Recherche `site:linkedin.com/posts "{topic}"`
- Pagination par lots de 10 résultats
- Maximum 100 résultats par requête (limite Google)

| ✅ Avantages                        | ❌ Inconvénients                          |
| ----------------------------------- | ----------------------------------------- |
| API **officielle** et stable        | **100 requêtes/jour gratuites** seulement |
| Recherche puissante avec opérateurs | $5 pour 1000 requêtes ensuite             |
| Résultats pertinents                | Max 100 résultats par recherche           |
| Pagination simple                   | Snippets parfois tronqués                 |

**🔧 Solutions d'amélioration** :

| Solution                                        | Complexité | Coût                  |
| ----------------------------------------------- | ---------- | --------------------- |
| **Cache des résultats** (Redis/Vercel KV)       | Moyenne    | ~$5/mois              |
| **SerpApi** (pas de limite quotidienne stricte) | Faible     | ~$50/mois             |
| **Bing Web Search API**                         | Faible     | 1000 req/mois gratuit |
| **Index personnalisé** (Algolia)                | Haute      | Variable              |

---

### 3. Scraping LinkedIn (Fetch + Cheerio)

**Fichiers** : `src/lib/googleCustomSearch.ts` + `src/lib/linkedinParser.ts`

**Fonctionnement** :

- Fetch HTTP direct des pages LinkedIn publiques
- Parsing HTML avec Cheerio (sélecteurs CSS)
- Extraction : auteur, avatar, contenu, date, likes, commentaires, image

| ✅ Avantages             | ❌ Inconvénients                |
| ------------------------ | ------------------------------- |
| Accès au contenu complet | LinkedIn **bloque les bots**    |
| Métriques d'engagement   | Structure HTML **peut changer** |
| Images et avatars        | Pas d'accès aux posts privés    |
| Gratuit                  | Headers User-Agent nécessaires  |

**🔧 Solutions d'amélioration** :

| Solution                               | Complexité | Coût                  |
| -------------------------------------- | ---------- | --------------------- |
| **Bright Data / ScraperAPI** (proxies) | Faible     | ~$30/mois             |
| **Puppeteer/Playwright** (rendu JS)    | Haute      | Gratuit               |
| **LinkedIn API officielle** (si accès) | Moyenne    | Nécessite partenariat |
| **PhantomBuster** (scraping managed)   | Faible     | ~$56/mois             |
| **RapidAPI LinkedIn scrapers**         | Faible     | ~$10-50/mois          |

---

## 📈 Roadmap d'amélioration

### Court terme (immédiat)

1. **Cache Redis/Vercel KV** pour les résultats Google CSE → Économise le quota

### Moyen terme

3. **SerpApi** pour remplacer les 2 APIs Google → Plus fiable, un seul provider
4. **ScraperAPI** pour LinkedIn → Proxies rotatifs intégrés

### Long terme

5. **Base de données propre** avec crawl périodique → Indépendance totale
6. **LinkedIn Marketing API** (si éligible) → Données officielles

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
