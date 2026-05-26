const DEFAULT_FILTERS = {
  query: '',
  sortMode: 'featured',
  priceFilter: 'all',
  categoryFilter: 'all',
  collectionFilter: 'all',
};

function getElement(selector) {
  return document.querySelector(selector);
}

function normalizeOptionValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getSummaryElement() {
  return getElement('#resultsSummary');
}

function updateSummary(count) {
  const summary = getSummaryElement();

  if (!summary) {
    return;
  }

  summary.textContent = `${count} produkt${count === 1 ? '' : 'er'} vist`;
}

function hideFilterGroup(groupName, hidden) {
  const wrapper = getElement(`[data-filter-group="${groupName}"]`);

  if (wrapper) {
    wrapper.style.display = hidden ? 'none' : '';
  }
}

function populateSelect(select, options, selectedValue) {
  if (!select) {
    return;
  }

  const currentValue = normalizeOptionValue(select.value);
  const optionValues = new Set();

  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = 'all';
  placeholder.textContent = 'Alle';
  select.appendChild(placeholder);

  options.forEach((option) => {
    const normalizedValue = normalizeOptionValue(option.id);

    if (optionValues.has(normalizedValue)) {
      return;
    }

    optionValues.add(normalizedValue);

    const element = document.createElement('option');
    element.value = normalizedValue;
    element.textContent = option.label;
    select.appendChild(element);
  });

  const normalizedSelected = normalizeOptionValue(selectedValue);
  const hasSelectedOption = options.some((option) => normalizeOptionValue(option.id) === normalizedSelected);

  if (hasSelectedOption) {
    select.value = normalizedSelected;
  } else {
    select.value = 'all';
  }

  if (currentValue && currentValue !== select.value && options.some((option) => normalizeOptionValue(option.id) === currentValue)) {
    select.value = currentValue;
  }
}

function syncFilterUI(filters, categories, collections) {
  populateSelect(getElement('#categoryFilter'), categories, filters.categoryFilter);
  populateSelect(getElement('#collectionFilter'), collections, filters.collectionFilter);

  hideFilterGroup('category', categories.length === 0);
  hideFilterGroup('collection', collections.length === 0);
}

function matchesPriceFilter(product, priceFilter) {
  const price = Number(product.rawPrice ?? 0);

  switch (priceFilter) {
    case 'under-50':
      return price < 50;
    case '50-100':
      return price >= 50 && price <= 100;
    case 'over-100':
      return price > 100;
    case 'all':
    default:
      return true;
  }
}

function matchesCategoryFilter(product, categoryFilter) {
  if (categoryFilter === 'all') {
    return true;
  }

  return normalizeOptionValue(product.categoryId) === normalizeOptionValue(categoryFilter);
}

function matchesCollectionFilter(product, collectionFilter) {
  if (collectionFilter === 'all') {
    return true;
  }

  return normalizeOptionValue(product.collectionId) === normalizeOptionValue(collectionFilter);
}

function filterProducts(products, filters) {
  const query = filters.query.trim().toLowerCase();

  const filtered = products
    .filter((product) => {
      const text = product.searchText || '';
      return !query || text.includes(query);
    })
    .filter((product) => matchesPriceFilter(product, filters.priceFilter))
    .filter((product) => matchesCategoryFilter(product, filters.categoryFilter))
    .filter((product) => matchesCollectionFilter(product, filters.collectionFilter));

  return filtered.sort((a, b) => {
    switch (filters.sortMode) {
      case 'price-asc':
        return a.rawPrice - b.rawPrice;
      case 'price-desc':
        return b.rawPrice - a.rawPrice;
      case 'title-asc':
        return a.title.localeCompare(b.title, 'da');
      case 'title-desc':
        return b.title.localeCompare(a.title, 'da');
      case 'featured':
      default:
        if (b.isFeatured !== a.isFeatured) {
          return Number(b.isFeatured) - Number(a.isFeatured);
        }

        if (b.isNew !== a.isNew) {
          return Number(b.isNew) - Number(a.isNew);
        }

        return a.title.localeCompare(b.title, 'da');
    }
  });
}

export function createProductFilters({ onChange }) {
  const controls = {
    searchInput: getElement('#searchInput'),
    sortSelect: getElement('#sortSelect'),
    priceFilter: getElement('#priceFilter'),
    categoryFilter: getElement('#categoryFilter'),
    collectionFilter: getElement('#collectionFilter'),
  };

  const filters = { ...DEFAULT_FILTERS };
  let products = [];
  let categories = [];
  let collections = [];

  function applyFilters() {
    const filteredProducts = filterProducts(products, filters);
    onChange(filteredProducts);
    updateSummary(filteredProducts.length);
  }

  function setProducts(nextProducts) {
    products = Array.isArray(nextProducts) ? nextProducts : [];
    syncFilterUI(filters, categories, collections);
    applyFilters();
  }

  function setMetadata(nextMetadata = {}) {
    categories = Array.isArray(nextMetadata.categories) ? nextMetadata.categories : [];
    collections = Array.isArray(nextMetadata.collections) ? nextMetadata.collections : [];
    syncFilterUI(filters, categories, collections);
    applyFilters();
  }

  function handleChange() {
    if (controls.searchInput) {
      filters.query = controls.searchInput.value;
    }

    if (controls.sortSelect) {
      filters.sortMode = controls.sortSelect.value;
    }

    if (controls.priceFilter) {
      filters.priceFilter = controls.priceFilter.value;
    }

    if (controls.categoryFilter) {
      filters.categoryFilter = controls.categoryFilter.value;
    }

    if (controls.collectionFilter) {
      filters.collectionFilter = controls.collectionFilter.value;
    }

    applyFilters();
  }

  Object.values(controls).forEach((control) => {
    if (!control) {
      return;
    }

    control.addEventListener('input', handleChange);
    control.addEventListener('change', handleChange);
  });

  return {
    setProducts,
    setMetadata,
  };
}
