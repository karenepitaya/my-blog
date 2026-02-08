import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { h as _h, type Properties } from 'hastscript'
import type { Paragraph as P } from 'mdast'

type MdastNode = Root['children'][number]

function h(el: string, attrs: Properties = {}, children: MdastNode[] = []): P {
  const { properties, tagName } = _h(el, attrs)
  return {
    children,
    data: { hName: tagName, hProperties: properties },
    type: 'paragraph',
  } as P
}

const remarkCharacterDialogue: Plugin<[{ characters: Record<string, string> }], Root> =
  (opts) => (tree) => {
    function isCharacterDialogue(s: string): s is keyof typeof opts.characters {
      return Object.prototype.hasOwnProperty.call(opts.characters, s) && opts.characters[s] !== undefined
    }

    if (!opts.characters || Object.keys(opts.characters).length === 0) {
      return
    }

    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined || node.type !== 'containerDirective') return

      const characterName = node.name
      if (!isCharacterDialogue(characterName)) return

      const align = node.attributes?.align ?? null
      const alignClass = align === 'left' || align === 'right' ? ` align-${align}` : ''

      const admonition = h(
        'aside',
        {
          'aria-label': `Character dialogue: ${characterName}`,
          class: 'character-dialogue' + alignClass,
          'data-character': characterName,
        },
        [
          h('img', {
            class: 'character-dialogue-image',
            alt: characterName,
            loading: 'lazy',
            src: opts.characters[characterName],
            width: 100,
          }),
          h('div', { class: 'character-dialogue-content' }, node.children as MdastNode[]),
        ],
      )

      parent.children[index] = admonition
    })
  }

export default remarkCharacterDialogue
