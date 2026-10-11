export function createDomElement(tagName, options = {}, children = []) {
    const element = document.createElement(tagName);
    const {
        className,
        textContent,
        value,
        checked,
        selected,
        style,
        dataset,
        ...attributes
    } = options;

    if (className) element.className = className;
    if (textContent !== undefined) element.textContent = String(textContent ?? '');
    if (value !== undefined) element.value = String(value ?? '');
    if (checked !== undefined) element.checked = Boolean(checked);
    if (selected !== undefined) element.selected = Boolean(selected);
    if (style) {
        if (typeof style === 'string') {
            element.style.cssText = style;
        } else {
            Object.assign(element.style, style);
        }
    }
    if (dataset) {
        Object.entries(dataset).forEach(([name, dataValue]) => {
            element.dataset[name] = String(dataValue ?? '');
        });
    }

    Object.entries(attributes).forEach(([name, attributeValue]) => {
        if (attributeValue !== undefined && attributeValue !== null) {
            element.setAttribute(name, String(attributeValue));
        }
    });

    children.filter(Boolean).forEach(child => element.append(child));
    return element;
}

export function createSelect(id, options, value = '') {
    const select = createDomElement('select', { id, className: 'swal2-select' });
    options.forEach(option => {
        select.append(createDomElement('option', {
            value: option.value,
            selected: String(option.value) === String(value),
            textContent: option.label,
        }));
    });
    return select;
}

export function safeHttpUrl(value, fallback = '') {
    if (typeof value !== 'string' || value.trim() === '') return fallback;

    try {
        const url = new URL(value, window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
    } catch {
        return fallback;
    }
}

export function safePublicAssetUrl(basePath, fileName, fallback) {
    if (typeof fileName !== 'string' || !/^[A-Za-z0-9._-]+$/.test(fileName)) {
        return fallback;
    }

    return safeHttpUrl(`${basePath.replace(/\/+$/, '')}/${fileName}`, fallback);
}

export function safePaginatorLabel(label) {
    if (label === '&laquo; Previous' || label === '« Previous') return '« Anterior';
    if (label === 'Next &raquo;' || label === 'Next »') return 'Próximo »';
    return typeof label === 'string' ? label : '';
}
