/**
 * This specific file was copied from cucumber-js.  As such their MIT License is included in this file.
The MIT License

Copyright (c) Julien Biezemans and contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { ITestCaseHookParameter } from './types'
import { Expression } from '@cucumber/cucumber-expressions'
import * as messages from '@cucumber/messages'

export interface IGetInvocationDataRequest {
  hookParameter: ITestCaseHookParameter
  step: messages.PickleStep
  world: any
}

export interface IGetInvocationDataResponse {
  getInvalidCodeLengthMessage: () => string
  parameters: any[]
  validCodeLengths: number[]
}

export interface IDefinitionOptions {
  timeout?: number
  wrapperOptions?: any
}

export interface IHookDefinitionOptions extends IDefinitionOptions {
  tags?: string
}

export interface IDefinitionParameters<T extends IDefinitionOptions> {
  code: Function
  id: string
  options: T
}

export interface IStepDefinitionParameters
  extends IDefinitionParameters<IDefinitionOptions> {
  pattern: string | RegExp
  expression: Expression
}

export interface IDefinition {
  readonly code: Function
  readonly id: string
  readonly options: IDefinitionOptions

  getInvocationParameters: (
    options: IGetInvocationDataRequest
  ) => Promise<IGetInvocationDataResponse>
}

export default abstract class Definition {
  public readonly code: Function
  public readonly id: string
  public readonly options: IDefinitionOptions

  constructor({
    code,
    id,
    options,
  }: IDefinitionParameters<IDefinitionOptions>) {
    this.code = code
    this.id = id
    this.options = options
  }

  buildInvalidCodeLengthMessage(
    syncOrPromiseLength: number | string,
    callbackLength: number | string
  ): string {
    return (
      `function has ${this.code.length.toString()} arguments` +
      `, should have ${syncOrPromiseLength.toString()} (if synchronous or returning a promise)` +
      ` or ${callbackLength.toString()} (if accepting a callback)`
    )
  }

  baseGetInvalidCodeLengthMessage(parameters: any[]): string {
    return this.buildInvalidCodeLengthMessage(
      parameters.length,
      parameters.length + 1
    )
  }
}

