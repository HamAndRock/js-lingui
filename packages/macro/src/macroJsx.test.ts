import { parseExpression as _parseExpression } from "@babel/parser"
import * as types from "@babel/types"
import MacroJSX from "./macroJsx"

const parseExpression = (expression) =>
  _parseExpression(expression, {
    plugins: ["jsx"],
  })

function createMacro() {
  return new MacroJSX({ types })
}

describe("jsx macro", () => {
  describe("tokenizeTrans", () => {
    it("simple message without arguments", () => {
      const macro = createMacro()
      const exp = parseExpression("<Trans>Message</Trans>")
      const tokens = macro.tokenizeTrans(exp)
      expect(tokens).toEqual([
        {
          type: "text",
          value: "Message",
        },
      ])
    })

    it("message with named argument", () => {
      const macro = createMacro()
      const exp = parseExpression("<Trans>Message {name}</Trans>")
      const tokens = macro.tokenizeTrans(exp)
      expect(tokens).toEqual([
        {
          type: "text",
          value: "Message ",
        },
        {
          type: "arg",
          name: "name",
          value: expect.objectContaining({
            name: "name",
            type: "Identifier",
          }),
        },
      ])
    })

    it("message with positional argument", () => {
      const macro = createMacro()
      const exp = parseExpression("<Trans>Message {obj.name}</Trans>")
      const tokens = macro.tokenizeTrans(exp)
      expect(tokens).toEqual([
        {
          type: "text",
          value: "Message ",
        },
        {
          type: "arg",
          name: 0,
          value: expect.objectContaining({
            type: "MemberExpression",
          }),
        },
      ])
    })

    it("message with plural", () => {
      const macro = createMacro()
      const exp = parseExpression(
        "<Trans>Message <Plural value={count} /></Trans>"
      )
      const tokens = macro.tokenizeTrans(exp)
      expect(tokens).toEqual([
        {
          type: "text",
          value: "Message ",
        },
        {
          type: "arg",
          name: "count",
          value: expect.objectContaining({
            type: "Identifier",
          }),
          format: "plural",
          options: {},
        },
      ])
    })
  })

  describe("tokenizeChoiceComponent", () => {
    it("plural", () => {
      const macro = createMacro()
      const exp = parseExpression(
        "<Plural value={count} one='# book' other='# books' />"
      )
      const tokens = macro.tokenizeChoiceComponent(exp)
      expect(tokens).toEqual({
        type: "arg",
        name: "count",
        value: expect.objectContaining({
          name: "count",
          type: "Identifier",
        }),
        format: "plural",
        options: {
          one: "# book",
          other: "# books",
        },
      })
    })

    it("plural with offset", () => {
      const macro = createMacro()
      const exp = parseExpression(
        `<Plural
          value={count}
          offset={1}
          _0='No books'
          one='# book'
          other='# books'
         />`
      )
      const tokens = macro.tokenizeChoiceComponent(exp)
      expect(tokens).toEqual({
        type: "arg",
        name: "count",
        value: expect.objectContaining({
          name: "count",
          type: "Identifier",
        }),
        format: "plural",
        options: {
          offset: 1,
          "=0": "No books",
          one: "# book",
          other: "# books",
        },
      })
    })

    it("plural with template literal", () => {
      const macro = createMacro()
      const exp = parseExpression(
        "<Plural value={count} one={`# glass of ${drink}`} other={`# glasses of ${drink}`} />"
      )
      const tokens = macro.tokenizeChoiceComponent(exp)
      expect(tokens).toEqual({
        type: "arg",
        name: "count",
        value: expect.objectContaining({
          name: "count",
          type: "Identifier",
        }),
        format: "plural",
        options: {
          one: [
            {
              type: "text",
              value: "# glass of ",
            },
            {
              type: "arg",
              name: "drink",
              value: expect.objectContaining({
                name: "drink",
                type: "Identifier",
              }),
            },
          ],
          other: [
            {
              type: "text",
              value: "# glasses of ",
            },
            {
              type: "arg",
              name: "drink",
              value: expect.objectContaining({
                name: "drink",
                type: "Identifier",
              }),
            },
          ],
        },
      })
    })

    it("plural with select", () => {
      const macro = createMacro()
      const exp = parseExpression(
        `<Plural
          value={count}
          one={
            <Select
              value={gender}
              _male="he"
              _female="she"
              other="they"
            />
          }
        />`
      )
      const tokens = macro.tokenizeChoiceComponent(exp)
      expect(tokens).toEqual({
        type: "arg",
        name: "count",
        value: expect.objectContaining({
          name: "count",
          type: "Identifier",
        }),
        format: "plural",
        options: {
          one: {
            type: "arg",
            name: "gender",
            value: expect.objectContaining({
              name: "gender",
              type: "Identifier",
            }),
            format: "select",
            options: {
              male: "he",
              female: "she",
              other: "they",
            },
          },
        },
      })
    })

    it("Select", () => {
      const macro = createMacro()
      const exp = parseExpression(
        `<Select
          value={gender}
          male="he"
          one="heone"
          female="she"
          other="they"
        />`
      )
      const tokens = macro.tokenizeNode(exp)
      expect(tokens).toEqual({
        format: "select",
        name: "gender",
        options: expect.objectContaining({
          female: "she",
          male: "he",
          offset: undefined,
          other: "they"
        }),
        type: "arg",
        value: expect.objectContaining({
          "end": 31,
          "loc":  {
            "end": {
              "column": 23,
              "line": 2,
            },
            "identifierName": "gender",
            "start":  {
              "column": 17,
              "line": 2,
            },
          },
          name: "gender",
          type: "Identifier",
        })
      })
    })
  })
})
