import { xml2js } from './xml2js';
import { Plugin } from './plugins/_types';
import { process } from './plugins/_plugins';
import { JsApi } from './jsapi';
import { js2xml } from './js2xml';

import * as removeXMLProcInst from './plugins/removeXMLProcInst';
import * as removeComments from './plugins/removeComments';
import * as removeXMLNS from './plugins/removeXMLNS';
import * as cleanupAttrs from './plugins/cleanupAttrs';
import * as cleanupIDs from './plugins/cleanupIDs';
import * as cleanupNumericValues from './plugins/cleanupNumericValues';
import * as convertColors from './plugins/convertColors';
import * as removeUnknownsAndDefaults from './plugins/removeUnknownsAndDefaults';
import * as removeNonInheritableGroupAttrs from './plugins/removeNonInheritableGroupAttrs';
import * as removeUselessStrokeAndFill from './plugins/removeUselessStrokeAndFill';
import * as removeHiddenElems from './plugins/removeHiddenElems';
import * as convertShapeToPath from './plugins/convertShapeToPath';
import * as moveElemsAttrsToGroup from './plugins/moveElemsAttrsToGroup';
import * as moveGroupAttrsToElems from './plugins/moveGroupAttrsToElems';
import * as collapseGroups from './plugins/collapseGroups';
import * as convertPathData from './plugins/convertPathData';
import * as convertTransform from './plugins/convertTransform';
import * as removeEmptyAttrs from './plugins/removeEmptyAttrs';
import * as removeEmptyContainers from './plugins/removeEmptyContainers';
import * as mergePaths from './plugins/mergePaths';
import * as removeUnusedNS from './plugins/removeUnusedNS';
import * as sortAttrs from './plugins/sortAttrs';
import * as removeDimensions from './plugins/removeDimensions';
import * as removeAttrs from './plugins/removeAttrs';
import * as removeElementsByAttr from './plugins/removeElementsByAttr';

export interface Options {
  plugins: Plugin[][];
  multipass?: boolean;
}

// Arrange plugins by type - this is what plugins() expects.
const optimizedPluginsData = (function optimizePluginsArray(plugins: Plugin[]) {
  return plugins.map(item => [item]).reduce(
    (arr, item) => {
      const last = arr[arr.length - 1];
      if (last && item[0].type === last[0].type) {
        last.push(item[0]);
      } else {
        arr.push(item);
      }
      return arr;
    },
    [] as Plugin[][]
  );
})([
  // The order is from https://github.com/svg/svgo/blob/master/.svgo.yml
  removeXMLProcInst,
  removeComments,
  removeXMLNS,
  cleanupAttrs,
  cleanupIDs,
  cleanupNumericValues,
  convertColors,
  removeUnknownsAndDefaults,
  removeNonInheritableGroupAttrs,
  removeUselessStrokeAndFill,
  removeHiddenElems,
  convertShapeToPath,
  moveElemsAttrsToGroup,
  moveGroupAttrsToElems,
  collapseGroups,
  convertPathData,
  convertTransform,
  removeEmptyAttrs,
  removeEmptyContainers,
  mergePaths,
  removeUnusedNS,
  sortAttrs,
  removeDimensions,
  // Some of these don't have a useful default action
  // 'removeAttrs': removeAttrs,
  // 'removeElementsByAttr': removeElementsByAttr,
  // 'addClassesToSVGElement': addClassesToSVGElement,
  // 'addAttributesToSVGElement': addAttributesToSVGElement,
]);

const defaultOptions: Options = {
  plugins: optimizedPluginsData,
};

export class Avdo {
  constructor(private readonly options = defaultOptions) {}

  optimize(
    svgstr,
    info?,
  ): Promise<{
    data: string;
    info: {
      width: number;
      height: number;
    };
  }> {
    return new Promise((resolve, reject) => {
      const options = this.options;
      const maxPassCount = options.multipass ? 10 : 1;
      let counter = 0;
      let prevResultSize = Number.POSITIVE_INFINITY;
      const onSuccess = (result: {
        data: string;
        info: { width: number; height: number };
      }) => {
        if (++counter < maxPassCount && result.data.length < prevResultSize) {
          prevResultSize = result.data.length;
          this._optimizeOnce(result.data, info, onSuccess, onFail);
        } else {
          // if (config.datauri) {
          //   svgjs.data = encodeSVGDatauri(svgjs.data, config.datauri);
          // }
          resolve(result);
        }
      };
      const onFail = error => reject(error);
      this._optimizeOnce(svgstr, info, onSuccess, onFail);
    });
  }

  private _optimizeOnce(svgstr, info, onSuccess, onFail) {
    const options = this.options;
    xml2js(
      svgstr,
      jsApi => {
        // console.log("==========");
        // console.log("optimizeOnceInfo", info);
        // console.log("optimizeOnce", "plugins", config.plugins);
        jsApi = process(jsApi, info, options.plugins);
        onSuccess(js2xml(jsApi, /*config.js2svg*/ undefined));
      },
      error => onFail(error),
    );
  }
}
