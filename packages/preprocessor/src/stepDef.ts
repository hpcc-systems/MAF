/**
 * This specific file was copied with slight modification from cucumber-js.  As such their MIT License is included in this file.
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
import Definition, {
  IDefinition,
  IGetInvocationDataRequest,
  IGetInvocationDataResponse,
  IStepDefinitionParameters,
} from './definition'
import { Expression } from '@cucumber/cucumber-expressions'
function doesNotHaveValue(value: any): boolean {
  return value === null || value === undefined
}
function doesHaveValue(value: any): boolean {
  return !doesNotHaveValue(value)

}

export default class StepDefinition extends Definition implements IDefinition {
  public readonly pattern: string | RegExp
  public readonly expression: Expression

  constructor(data: IStepDefinitionParameters) {
    super(data)
    this.pattern = data.pattern
    this.expression = data.expression
  }

  async getInvocationParameters({
    step,
    world,
  }: IGetInvocationDataRequest): Promise<IGetInvocationDataResponse> {
    const parameters = await Promise.all(
      this.expression.match(step.text).map((arg) => arg.getValue(world))
    )
    return {
      getInvalidCodeLengthMessage: () =>
        this.baseGetInvalidCodeLengthMessage(parameters),
      parameters,
      validCodeLengths: [parameters.length, parameters.length + 1],
    }
  }

  matchesStepName(stepName: string): boolean {
    return doesHaveValue(this.expression.match(stepName))
  }
}

