import { supabase } from './supabase.js';
import { createProductFilters } from './productFilters.js';

const FALLBACK_IMAGE = 'imgs/logo.webp';
const priceFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
});

const shopContainer = document.querySelector('#shop');

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return 'Pris ikke angivet';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return priceFormatter.format(number);
}

function getStockLabel(stock) {
  if (stock === null || stock === undefined || stock === '') {
    return 'Status ukendt';
  }

  const stockCount = Number(stock);

  if (Number.isNaN(stockCount)) {
    return String(stock);
  }

  if (stockCount <= 0) {
    return 'Udsolgt';
  }

  if (stockCount <= 3) {
    return `Kun ${stockCount} tilbage`;
  }

  return `${stockCount} på lager`;
}

function normalizeColor(value) {
  return String(value ?? '').trim().toLowerCase();
}

function capitalize(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getLabel(value, fallback) {
  const text = String(value ?? '').trim();

  if (!text) {
    return fallback;
  }

  return capitalize(text);
}

function resolveCatalogLabel(entry, fallback) {
  if (!entry) {
    return fallback;
  }

  return (
    getLabel(entry.name, '') ||
    getLabel(entry.title, '') ||
    getLabel(entry.label, '') ||
    getLabel(entry.slug, '') ||
    fallback
  );
}

function getColorHex(colorName) {
  const normalized = normalizeColor(colorName);

  if (!normalized) {
    return '#d9d9d9';
  }

  switch (normalized) {
    case 'black':
    case 'mørk':
    case 'navy':
      return '#111111';
    case 'white':
    case 'hvid':
      return '#ffffff';
    case 'beige':
      return '#d8c0a4';
    case 'green':
    case 'grøn':
      return '#1b7b52';
    case 'red':
    case 'rød':
      return '#b53b3b';
    case 'blue':
    case 'blå':
      return '#2f6fe5';
    case 'brown':
    case 'brun':
      return '#8b5e3c';
    default:
      return '#d9d9d9';
  }
}

function buildCatalogOptions(rows, products, kind) {
  const validRows = toArray(rows)
    .map((row) => ({
      id: row?.id ?? row?.value ?? row?.slug ?? '',
      label: resolveCatalogLabel(row, ''),
    }))
    .filter((row) => Boolean(row.id) && Boolean(row.label));

  if (validRows.length > 0) {
    return validRows.sort((a, b) => a.label.localeCompare(b.label, 'da'));
  }

  const ids = new Set();

  products.forEach((product) => {
    const id = kind === 'category' ? product.categoryId : product.collectionId;

    if (id) {
      ids.add(id);
    }
  });

  return Array.from(ids).map((id, index) => ({
    id,
    label: kind === 'category' ? `Kategori ${index + 1}` : `Kollektion ${index + 1}`,
  }));
}

function normalizeImageVariants(product) {
  const imageRows = toArray(product.product_images);

  if (imageRows.length > 0) {
    const uniqueRows = new Map();

    imageRows.forEach((row) => {
      const colorKey = normalizeColor(row?.color || row?.color_name || row?.color_hex || 'default');
      const imageUrl = row?.image_url || row?.url || product.imageUrl || FALLBACK_IMAGE;

      if (!uniqueRows.has(colorKey)) {
        uniqueRows.set(colorKey, {
          value: colorKey,
          label: capitalize(colorKey) || 'Standard',
          imageUrl,
          swatchColor: row?.color_hex || getColorHex(colorKey),
        });
      }
    });

    return Array.from(uniqueRows.values());
  }

  const colors = toArray(product.details?.colors)
    .map((color) => normalizeColor(color))
    .filter(Boolean);

  if (colors.length === 0) {
    return [
      {
        value: 'default',
        label: 'Standard',
        imageUrl: product.imageUrl || FALLBACK_IMAGE,
        swatchColor: '#d9d9d9',
      },
    ];
  }

  return Array.from(new Set(colors)).map((colorKey) => ({
    value: colorKey,
    label: capitalize(colorKey),
    imageUrl: product.imageUrl || FALLBACK_IMAGE,
    swatchColor: getColorHex(colorKey),
  }));
}

function normalizeProduct(product) {
  const rawPrice = Number(product?.price ?? 0);
  const stockCount = Number(product?.stock ?? 0);
  const soldOut = stockCount <= 0;
  const imageUrl = product?.image_url || product?.image || product?.img || FALLBACK_IMAGE;
  const title = product?.name || product?.title || product?.product_name || 'Produkt';
  const description = product?.description || 'Elegant design med fokus på kvalitet og funktion.';
  const variants = normalizeImageVariants({
    ...product,
    imageUrl,
  });
  const activeVariant = variants[0]?.value || 'default';
  const categoryId = product?.category_id || '';
  const collectionId = product?.collection_id || '';

  return {
    id: product?.id,
    title,
    description,
    rawPrice,
    price: formatPrice(rawPrice),
    stockLabel: getStockLabel(product?.stock),
    stockCount,
    stockClass: stockCount <= 3 ? 'product-card__stock--low' : '',
    soldOut,
    isNew: Boolean(product?.is_new),
    isFeatured: Boolean(product?.is_featured),
    discountPercent: Number(product?.discount_percent ?? 0),
    imageUrl,
    variants,
    activeVariant,
    categoryId,
    collectionId,
    searchText: `${title} ${description}`.toLowerCase(),
  };
}

function createBadgeMarkup(product) {
  const badges = [];

  if (product.isNew) {
    badges.push('<span class="product-card__badge product-card__badge--accent">NEW</span>');
  }

  if (product.isFeatured) {
    badges.push('<span class="product-card__badge product-card__badge--accent">FEATURED</span>');
  }

  if (product.discountPercent > 0) {
    badges.push(`<span class="product-card__badge product-card__badge--warning">-${Math.round(product.discountPercent)}%</span>`);
  }

  return badges.length > 0 ? `<div class="product-card__badges">${badges.join('')}</div>` : '';
}

function createSwatchesMarkup(product) {
  if (product.variants.length <= 1) {
    return '';
  }

  const chips = product.variants
    .map((variant) => {
      const isActive = variant.value === product.activeVariant;

      return `
        <button
          type="button"
          class="product-card__swatch ${isActive ? 'product-card__swatch--active' : ''}"
          data-color-key="${variant.value}"
          data-image-url="${variant.imageUrl}"
          style="background:${variant.swatchColor};"
          aria-label="Skift til ${variant.label}"
          aria-pressed="${isActive ? 'true' : 'false'}"
        ></button>`;
    })
    .join('');

  return `<div class="product-card__swatches">${chips}</div>`;
}

function createProductCard(product) {
  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-card__visual">
        <img
          class="product-card__image"
          src="${product.imageUrl}"
          alt="${product.title}"
          data-default-image="${product.imageUrl}"
          loading="lazy"
        />
        ${createBadgeMarkup(product)}
      </div>

      <div class="product-card__content">
        <h3 class="product-card__title">${product.title}</h3>
        <p class="product-card__collection">${product?.collection_id}</p>
        <p class="product-card__description">${product.description}</p>
        ${createSwatchesMarkup(product)}

        <div class="product-card__footer">
          <div>
            <p class="product-card__price">${product.price}</p>
            <p class="product-card__stock ${product.stockClass}">${product.stockLabel}</p>
          </div>

          <div class="product-card__actions">
            <button class="product-card__button" type="button" ${product.soldOut ? 'disabled' : ''}>
              ${product.soldOut ? 'Udsolgt' : 'Læg i kurv'}
            </button>
            <button class="product-card__ghost" type="button">Se detaljer</button>
          </div>
        </div>
      </div>
    </article>`;
}

function setCardSwatchState(card, button) {
  if (!card || !button) {
    return;
  }

  const image = card.querySelector('.product-card__image');
  const nextImage = button.dataset.imageUrl;

  card.querySelectorAll('.product-card__swatch').forEach((chip) => {
    const isActive = chip === button;
    chip.classList.toggle('product-card__swatch--active', isActive);
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (image && nextImage) {
    image.src = nextImage;
  }
}

function renderProducts(products) {
  if (!shopContainer) {
    return;
  }

  shopContainer.classList.add('is-updating');

  if (!Array.isArray(products) || products.length === 0) {
    shopContainer.innerHTML = `
      <div class="shop-grid__empty">
        <div>
          <h3>Ingen produkter at vise lige nu</h3>
          <p>Prøv en anden søgning eller ændr sorteringen.</p>
        </div>
      </div>`;

    window.requestAnimationFrame(() => {
      shopContainer.classList.remove('is-updating');
    });

    return;
  }

  shopContainer.innerHTML = products.map(createProductCard).join('');
  shopContainer.querySelectorAll('.product-card__swatch').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      setCardSwatchState(card, button);
    });
  });

  window.requestAnimationFrame(() => {
    shopContainer.classList.remove('is-updating');
  });
}

async function loadProducts() {
  if (!shopContainer) {
    return;
  }

  shopContainer.innerHTML = `
    <div class="shop-grid__empty">
      <div>
        <h3>Indlæser produkter…</h3>
        <p>Vi henter data fra Supabase og opdaterer siden.</p>
      </div>
    </div>`;

  try {
    const [productsResult, categoriesResult, collectionsResult] = await Promise.allSettled([
      supabase.from('products').select('*,product_images(*)'),
      supabase.from('categories').select('*'),
      supabase.from('collections').select('*'),
    ]);

    const productsData = productsResult.status === 'fulfilled' ? productsResult.value.data ?? [] : [];
    const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data ?? [] : [];
    const collectionsData = collectionsResult.status === 'fulfilled' ? collectionsResult.value.data ?? [] : [];

    if (!Array.isArray(productsData) || productsData.length === 0) {
      renderProducts([]);
      return;
    }

    const products = productsData.map(normalizeProduct);
    const filters = createProductFilters({ onChange: renderProducts });

    filters.setProducts(products);
    filters.setMetadata({
      categories: buildCatalogOptions(categoriesData, products, 'category'),
      collections: buildCatalogOptions(collectionsData, products, 'collection'),
    });
  } catch (error) {
    renderProducts([]);
  }
}

loadProducts();
