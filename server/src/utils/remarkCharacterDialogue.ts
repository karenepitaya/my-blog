import type { Plugin } from 'unified';

type CharactersMap = Record<string, string>;

type AstNode = {
  type?: string;
  name?: string;
  attributes?: Record<string, unknown>;
  children?: AstNode[];
  data?: Record<string, unknown>;
};

type Root = {
  type: 'root';
  children: AstNode[];
};

type ContainerDirective = {
  type: 'containerDirective';
  name: string;
  attributes?: Record<string, unknown>;
  children?: AstNode[];
};

function isContainerDirective(node: AstNode | null | undefined): node is ContainerDirective {
  return Boolean(
    node && typeof node === 'object' && node.type === 'containerDirective' && typeof node.name === 'string'
  );
}

function h(tagName: string, properties: Record<string, unknown> = {}, children: AstNode[] = []): AstNode {
  return {
    type: 'paragraph',
    children,
    data: {
      hName: tagName,
      hProperties: properties,
    },
  };
}

function normalizeCharacters(input: CharactersMap): CharactersMap {
  const result: CharactersMap = {};
  const entries = Object.entries(input ?? {});
  for (const [rawName, rawUrl] of entries) {
    const name = String(rawName ?? '').trim();
    const url = String(rawUrl ?? '').trim();
    if (!name || !url) continue;
    result[name] = url;
    if (Object.keys(result).length >= 30) break;
  }
  return result;
}

const remarkCharacterDialogue: Plugin<[{ characters: CharactersMap }], Root> = (opts) => (tree) => {
  const characters = normalizeCharacters(opts?.characters ?? {});
  const characterNames = new Set(Object.keys(characters));

  if (characterNames.size === 0) return;

  const walk = (parent: AstNode) => {
    const children = parent.children;
    if (!Array.isArray(children)) return;

    for (let index = 0; index < children.length; index++) {
      const node = children[index];
      if (isContainerDirective(node)) {
        const characterName = String(node.name ?? '').trim();
        if (!characterNames.has(characterName)) {
          walk(node);
          continue;
        }

        const align = typeof node.attributes?.align === 'string' ? node.attributes.align : null;
        const alignClass = align === 'left' || align === 'right' ? ` align-${align}` : '';

        // Do not change prefix to AD, ADM, or similar, adblocks will block the content inside.
        children[index] = h(
          'aside',
          {
            'aria-label': `Character dialogue: ${characterName}`,
            class: `character-dialogue${alignClass}`,
            'data-character': characterName,
          },
          [
            h('img', {
              class: 'character-dialogue-image',
              alt: characterName,
              loading: 'lazy',
              src: characters[characterName],
              width: 100,
            }),
            h('div', { class: 'character-dialogue-content' }, node.children ?? []),
          ],
        );
        continue;
      }

      walk(node);
    }
  };

  walk(tree);
};

export default remarkCharacterDialogue;
