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
import {
  CucumberExpression,
  RegularExpression,
  ParameterTypeRegistry
} from '@cucumber/cucumber-expressions'
import StepDefinition from './stepDef'

import {
  IDefineSupportCodeMethods,
  DefineStepPattern,
  IDefineStepOptions,
} from './types'
import { IdGenerator } from '@cucumber/messages'
const { uuid } = IdGenerator


interface IStepDefinitionConfig {
  code: any
  options: any
  pattern: string | RegExp
}


export class SupportCodeLibraryBuilder {
  private stepDefinitionConfigs: IStepDefinitionConfig[]
  public readonly methods: IDefineSupportCodeMethods
  private parameterTypeRegistry: ParameterTypeRegistry
  private newId: IdGenerator.NewId
  public  build: ()=> StepDefinition[]


  constructor() {
    const addExpression = this.addExpression.bind(this)
    this.newId=uuid()
    this.stepDefinitionConfigs=[]
    this.parameterTypeRegistry = new ParameterTypeRegistry()
    this.methods = {
      addExpression: addExpression,
      Apply: addExpression,
    }
    this.build=this.buildStepDefinitions.bind(this)
  }

  addExpression(
    pattern: DefineStepPattern,
    options: IDefineStepOptions | Function,
    code?: Function
  ): void {
    if (typeof options === 'function') {
      code = options
      options = {}
    }
    /*const { line, uri } = getDefinitionLineAndUri(this.cwd)
    validateArguments({
      args: { code, pattern, options },
      fnName: 'defineStep',
      location: formatLocation({ line, uri }),
    })
    */
    this.stepDefinitionConfigs.push({
      code,
      options,
      pattern,
    })
  }
  buildStepDefinitions(): StepDefinition[] {
    return this.stepDefinitionConfigs.map(
      ({ code, options, pattern}) => {
        const expression =
          typeof pattern === 'string'
            ? new CucumberExpression(pattern, this.parameterTypeRegistry)
            : new RegularExpression(pattern, this.parameterTypeRegistry)
        return new StepDefinition({
          code: code,
          expression,
          id: this.newId(),
          options,
          pattern,
        })
      }
    )
  }


}
export default new SupportCodeLibraryBuilder()

