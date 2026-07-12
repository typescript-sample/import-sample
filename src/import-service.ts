import { once } from 'events';
import { WriteStream } from 'fs';
import * as fs from 'fs';
import * as promises from 'node:fs/promises';
import * as readline from 'readline';

// tslint:disable-next-line:class-name
export class resources {
  static regex = /[^\d](\d{14})\.csv$/g;
}
export function getDate(fileName: string): Date | undefined {
  const r = new RegExp(resources.regex);
  const nm = r.exec(fileName);
  if (!nm || nm.length < 2) {
    return undefined;
  }
  const v = nm[1];
  const ft = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(8, 10)}:${v.slice(10, 12)}:${v.slice(12, 14)}`;
  const d = new Date(ft);
  const num = d.getTime();
  if (!num || isNaN(num)) {
    return undefined;
  }
  return d;
}
export interface SimpleMap {
  [key: string]: string | number | boolean | Date;
}
export type DataType = 'ObjectId' | 'date' | 'datetime' | 'time'
  | 'boolean' | 'number' | 'integer' | 'string' | 'text'
  | 'object' | 'array' | 'binary'
  | 'primitives' | 'booleans' | 'numbers' | 'integers' | 'strings' | 'dates' | 'datetimes' | 'times';
export type FormatType = 'currency' | 'percentage' | 'email' | 'url' | 'phone' | 'fax' | 'ipv4' | 'ipv6';
export type MatchType = 'equal' | 'prefix' | 'contain' | 'max' | 'min'; // contain: default for string, min: default for Date, number

export interface Attribute {
  name?: string;
  field?: string;
  column?: string;
  type?: DataType;
  format?: FormatType;
  required?: boolean;
  match?: MatchType;
  default?: string | number | Date | boolean;
  key?: boolean;
  unique?: boolean;
  enum?: string[] | number[];
  q?: boolean;
  noinsert?: boolean;
  noupdate?: boolean;
  nopatch?: boolean;
  version?: boolean;
  length?: number;
  min?: number;
  max?: number;
  gt?: number;
  lt?: number;
  precision?: number;
  scale?: number;
  exp?: RegExp | string;
  code?: string;
  noformat?: boolean;
  ignored?: boolean;
  jsonField?: string;
  link?: string;
  typeof?: Attributes;
  true?: string | number;
  false?: string | number;
  getString?: (v: any) => string;
}
export interface Attributes {
  [key: string]: Attribute;
}

export interface ErrorMessage {
  field: string;
  code: string;
  param?: string | number | Date;
  message?: string;
}
export interface Result {
  total: number;
  success: number;
}
interface TmpResult {
  total: number;
  success: number;
  i: number;
}
export interface Parser<T> {
  parse: (data: string) => Promise<T>;
}
export interface Transformer<T> {
  transform: (data: string) => Promise<T>;
}
export interface Validator<T> {
  validate: (data: T) => Promise<ErrorMessage[]>;
}
export interface Writer<T> {
  write: (obj: T) => Promise<number>;
  flush?: () => Promise<number>;
}
export interface ErrHandler<T> {
  handleError(rs: T, errors: ErrorMessage[], i?: number, filename?: string): void;
}
export interface ExHandler {
  handleException(rs: string, err: any, i?: number, filename?: string): void;
}
export interface ImportManager {
  filename: string;
  read: readline.Interface;
  import(): Promise<Result>;
}
// tslint:disable-next-line:max-classes-per-file
export class Importer<T> {
  constructor(
    public skip: number,
    public filename: string,
    public read: readline.Interface,
    public transform: (data: string) => Promise<T>,
    public write: (obj: T) => Promise<number>,
    public flush?: () => Promise<number>,
    public handleException?: (rs: string, err: any, i?: number, filename?: string) => void,
    public validate?: ((obj: T) => Promise<ErrorMessage[]>),
    public handleError?: (rs: T, errors: ErrorMessage[], i?: number, filename?: string) => void,
  ) {
    this.import = this.import.bind(this);
    this.transformAndWrite = this.transformAndWrite.bind(this);
    this.validateAndWrite = this.validateAndWrite.bind(this);
  }
  async import(): Promise<Result> {
    let total = 0;
    let success = 0;
    const v = this.validate;
    let lineSkiped = 0;
    const lastLine = '';
    if (v) {
      let i = 0;
      if (this.skip > 0) {
        for await (const _line of this.read) {
          ++lineSkiped;
          if (this.skip === lineSkiped) {
            const r = await this.validateAndWrite(lastLine, total, v, i);
            total = r.total;
            success = r.success;
            i = r.i;
            break;
          }
        }
      } else {
        const r = await this.validateAndWrite(lastLine, total, v, i);
        total = r.total;
        success = r.success;
        i = r.i;
      }
      return { total, success };
    } else {
      let i = 0;
      for await (const _line of this.read) {
        ++lineSkiped;
        i++;
        if (this.skip) {
          if (this.skip === lineSkiped) {
            const r = await this.transformAndWrite(lastLine, total, i);
            total = r.total;
            success = r.success;
            i = r.i;
            break;
          }
        } else {
          const r = await this.transformAndWrite(lastLine, total, i);
          total = r.total;
          success = r.success;
          i = r.i;
          break;
        }
      }
      return { total, success };
    }
  }
  private async validateAndWrite(lastLine: string, total: number, validate: ((obj: T) => Promise<ErrorMessage[]>), i: number): Promise<TmpResult> {
    let success = 0;
    for await (const line of this.read) {
      lastLine = line;
      total++;
      try {
        const rs: T = await this.transform(line);
        const errors = await validate(rs);
        if (errors && errors.length > 0) {
          if (this.handleError) {
            this.handleError(rs, errors, i++, this.filename);
          }
        } else {
          const r = await this.write(rs);
          if (r > 0) {
            success = success + r;
          }
          i++;
        }
      } catch (err) {
        if (this.handleException) {
          this.handleException(line, err, i++, this.filename);
        }
      }
    }
    if (this.flush) {
      try {
        const r = await this.flush();
        if (r > 0) {
          success = success + r;
        }
      } catch (err) {
        if (this.handleException) {
          this.handleException(lastLine, err, i, this.filename);
        }
      }
    }
    return { total, success, i };
  }
  private async transformAndWrite(lastLine: string, total: number, i: number): Promise<TmpResult> {
    let success = 0;
    for await (const line of this.read) {
      lastLine = line;
      i++;
      total++;
      try {
        const rs: T = await this.transform(line);
        const r = await this.write(rs);
        if (r > 0) {
          success = success + r;
        }
      } catch (err) {
        if (this.handleException) {
          this.handleException(line, err, i, this.filename);
        }
      }
    }
    if (this.flush) {
      try {
        const r = await this.flush();
        if (r > 0) {
          success = success + r;
        }
      } catch (err) {
        if (this.handleException) {
          this.handleException(lastLine, err, i, this.filename);
        }
      }
    }
    return { total, success, i };
  }
}
// tslint:disable-next-line:max-classes-per-file
export class ImportService<T> {
  constructor(
    public skip: number,
    public filename: string,
    public read: readline.Interface,
    public transformer: Transformer<T>,
    public writer: Writer<T>,
    public exceptionHandler?: ExHandler,
    public validator?: Validator<T>,
    public errorHandler?: ErrHandler<T>
  ) {
    this.import = this.import.bind(this);
    this.validateAndWrite = this.validateAndWrite.bind(this);
    this.transformAndWrite = this.transformAndWrite.bind(this);
  }
  async import(): Promise<Result> {
    let total = 0;
    let success = 0;
    const v = this.validator;
    let lineSkiped = 0;
    const lastLine = '';
    if (v) {
      let i = 0;
      if (this.skip > 0) {
        for await (const _line of this.read) {
          ++lineSkiped;
          if (this.skip === lineSkiped) {
            const r = await this.validateAndWrite(lastLine, total, v, i);
            total = r.total;
            success = r.success;
            i = r.i;
            break;
          }
        }
      } else {
        const r = await this.validateAndWrite(lastLine, total, v, i);
        total = r.total;
        success = r.success;
        i = r.i;
      }
      return { total, success };
    } else {
      let i = 0;
      for await (const _line of this.read) {
        ++lineSkiped;
        i++;
        if (this.skip) {
          if (this.skip === lineSkiped) {
            const r = await this.transformAndWrite(lastLine, total, i);
            total = r.total;
            success = r.success;
            i = r.i;
            break;
          }
        } else {
          const r = await this.transformAndWrite(lastLine, total, i);
          total = r.total;
          success = r.success;
          i = r.i;
          break;
        }
      }
      return { total, success };
    }
  }
  private async validateAndWrite(lastLine: string, total: number, v: Validator<T>, i: number): Promise<TmpResult> {
    let success = 0;
    for await (const line of this.read) {
      lastLine = line;
      total++;
      try {
        const rs: T = await this.transformer.transform(line);
        const errors = await v.validate(rs);
        if (errors && errors.length > 0) {
          if (this.errorHandler) {
            this.errorHandler.handleError(rs, errors, i++, this.filename);
          }
        } else {
          const r = await this.writer.write(rs);
          if (r > 0) {
            success = success + r;
          }
          i++;
        }
      } catch (err) {
        if (this.exceptionHandler) {
          this.exceptionHandler.handleException(line, err, i++, this.filename);
        }
      }
    }
    if (this.writer.flush) {
      try {
        const r = await this.writer.flush();
        if (r > 0) {
          success = success + r;
        }
      } catch (err) {
        if (this.exceptionHandler) {
          this.exceptionHandler.handleException(lastLine, err, i, this.filename);
        }
      }
    }
    return { total, success, i };
  }
  private async transformAndWrite(lastLine: string, total: number, i: number): Promise<TmpResult> {
    let success = 0;
    for await (const line of this.read) {
      lastLine = line;
      i++;
      total++;
      try {
        const rs: T = await this.transformer.transform(line);
        const r = await this.writer.write(rs);
        if (r > 0) {
          success = success + r;
        }
      } catch (err) {
        if (this.exceptionHandler) {
          this.exceptionHandler.handleException(line, err, i, this.filename);
        }
      }
    }
    if (this.writer.flush) {
      try {
        const r = await this.writer.flush();
        if (r > 0) {
          success = success + r;
        }
      } catch (err) {
        if (this.exceptionHandler) {
          this.exceptionHandler.handleException(lastLine, err, i, this.filename);
        }
      }
    }
    return { total, success, i };
  }
}
export function toString(v: any): string {
  if (typeof v === 'string') {
    return v;
  } else {
    return JSON.stringify(v);
  }
}
function clone(obj: any): any {
  const r: any = {};
  if (obj !== undefined) {
    const keys = Object.keys(obj);
    for (const key of keys) {
      r[key] = (obj as any)[key];
    }
  }
  return r;
}
// tslint:disable-next-line:max-classes-per-file
export class ErrorHandler<T> {
  constructor(public logError: (obj: string, m?: SimpleMap) => void, filename?: string, lineNumber?: string, mp?: SimpleMap, prefix?: string) {
    this.map = mp;
    this.prefix = (prefix && prefix.length > 0 ? prefix : 'Message is invalid: ');
    this.filename = (filename && filename.length > 0 ? filename : 'filename');
    this.logFileName = (filename && filename.length > 0 ? true : false);
    this.lineNumber = (lineNumber && lineNumber.length > 0 ? lineNumber : 'lineNumber');
    this.logLineNumber = (lineNumber && lineNumber.length > 0 ? true : false);
    this.handleError = this.handleError.bind(this);
  }
  prefix: string;
  map?: SimpleMap;
  filename: string;
  lineNumber: string;
  private logFileName: boolean;
  private logLineNumber: boolean;
  handleError(rs: T, err: ErrorMessage[], i?: number, filename?: string): void {
    if (this.logFileName && this.logLineNumber) {
      const ext = clone(this.map);
      if (filename !== undefined) {
        ext[this.filename] = filename;
      }
      if (i !== undefined) {
        ext[this.lineNumber] = i;
      }
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)}`, ext);
    } else if (this.logFileName) {
      const ext = clone(this.map);
      if (filename !== undefined) {
        ext[this.filename] = filename;
      }
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)} line: ${i}`, ext);
    } else if (this.logLineNumber) {
      const ext = clone(this.map);
      if (i !== undefined) {
        ext[this.lineNumber] = i;
      }
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)} filename: ${filename}`, ext);
    } else {
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)} filename: ${filename} line: ${i}`);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class ExceptionHandler {
  constructor(public logError: (obj: string, m?: SimpleMap) => void, filename?: string, lineNumber?: string, mp?: SimpleMap, prefix?: string) {
    this.map = mp;
    this.prefix = (prefix && prefix.length > 0 ? prefix : 'Error to write: ');
    this.filename = (filename && filename.length > 0 ? filename : 'filename');
    this.logFileName = (filename && filename.length > 0 ? true : false);
    this.lineNumber = (lineNumber && lineNumber.length > 0 ? lineNumber : 'lineNumber');
    this.logLineNumber = (lineNumber && lineNumber.length > 0 ? true : false);
    this.handleException = this.handleException.bind(this);
  }
  prefix: string;
  map?: SimpleMap;
  filename: string;
  lineNumber: string;
  private logFileName: boolean;
  private logLineNumber: boolean;
  handleException(rs: string, err: any, i?: number, filename?: string): void {
    if (this.logFileName && this.logLineNumber) {
      const ext = clone(this.map);
      if (filename !== undefined) {
        ext[this.filename] = filename;
      }
      if (i !== undefined) {
        ext[this.lineNumber] = i;
      }
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)}`, ext);
    } else if (this.logFileName) {
      const ext = clone(this.map);
      if (filename !== undefined) {
        ext[this.filename] = filename;
      }
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)} line: ${i}`, ext);
    } else if (this.logLineNumber) {
      const ext = clone(this.map);
      if (i !== undefined) {
        ext[this.lineNumber] = i;
      }
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)} filename: ${filename}`, ext);
    } else {
      this.logError(`${this.prefix}${toString(rs)} . Error: ${toString(err)} filename: ${filename} line: ${i}`, this.map);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class Delimiter<T> {
  constructor(private delimiter: string, private attrs: Attributes) {
    this.transform = this.transform.bind(this);
    this.parse = this.parse.bind(this);
  }
  parse(data: string): Promise<T> {
    return this.transform(data);
  }
  transform(data: string): Promise<T> {
    const keys = Object.keys(this.attrs);
    let rs: any = {};
    const list: string[] = data.split(this.delimiter);
    const l = Math.min(list.length, keys.length);
    for (let i = 0; i < l; i++) {
      const attr = this.attrs[keys[i]];
      const v = list[i];
      rs = parse(rs, v, keys[i], attr);
    }
    return Promise.resolve(rs);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class DelimiterTransformer<T> extends Delimiter<T> {
}
// tslint:disable-next-line:max-classes-per-file
export class DelimiterParser<T> extends Delimiter<T> {
}
// tslint:disable-next-line:max-classes-per-file
export class CSVParser<T> extends Delimiter<T> {
}
// tslint:disable-next-line:max-classes-per-file
export class FixedLengthTransformer<T> {
  constructor(private attrs: Attributes) {
    this.transform = this.transform.bind(this);
    this.parse = this.parse.bind(this);
  }
  parse(data: string): Promise<T> {
    return this.transform(data);
  }
  transform(data: string): Promise<T> {
    const keys = Object.keys(this.attrs);
    let rs: any = {};
    let i = 0;
    for (const key of keys) {
      const attr = this.attrs[key];
      const len = attr.length ? attr.length : 10;
      const v = data.substring(i, i + len);
      rs = parse(rs, v.trim(), key, attr);
      i = i + len;
    }
    return Promise.resolve(rs);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class FixedLengthParser<T> extends FixedLengthTransformer<T> {
}
export function parse(rs: any, v: string, key: string, attr: Attribute): any {
  if (attr.default !== undefined && v.length === 0) {
    rs[key] = attr.default;
    return rs;
  }
  switch (attr.type) {
    case 'number':
    case 'integer':
      // tslint:disable-next-line:radix
      const parsed = parseInt(v);
      if (!isNaN(parsed) || !Number(parsed)) {
        rs[key] = parsed;
      }
      break;
    case 'datetime':
    case 'date':
      const d = new Date(v);
      if (d instanceof Date && !isNaN(d.valueOf())) {
        rs[key] = d;
      }
      break;
    case 'boolean':
      if (v === '1' || v === 'Y' || v === 'T') {
        rs[key] = true;
      } else if (v.length > 0) {
        rs[key] = false;
      }
      break;
    default:
      rs[key] = v;
      break;
  }
  return rs;
}
export function handleNullable(obj: any, attrs: Attributes): any {
  const keys = Object.keys(obj);
  for (const key of keys) {
    const v = obj[key];
    if (v === '') {
      const attr = attrs[key];
      if (attr && !attr.required) {
        obj[key] = null;
      }
    }
  }
  return obj;
}
// tslint:disable-next-line:ban-types
export function buildStrings(files: String[]): string[] {
  const res: string[] = [];
  for (const file of files) {
    res.push(file.toString());
  }
  return res;
}
export function getFiles(files: string[], check: (s: string) => boolean): string[] {
  const res: string[] = [];
  for (const file of files) {
    const v = check(file);
    if (v === true) {
      res.push(file);
    }
  }
  return res;
}
// tslint:disable-next-line:max-classes-per-file
export class NameChecker {
  constructor(private prefix: string, private suffix: string) {
    this.check = this.check.bind(this);
  }
  check(name: string): boolean {
    if (name.startsWith(this.prefix) && name.endsWith(this.suffix)) {
      return true;
    }
    return false;
  }
}
export function getPrefix(s: string, date: Date, offset?: number, separator?: string): string {
  if (offset !== undefined) {
    const d = addDays(date, offset);
    return s + dateToString(d, separator);
  } else {
    return s + dateToString(date, separator);
  }
}
export function dateToString(date: Date, separator?: string): string {
  const year = date.getFullYear().toString();
  let month: number | string = date.getMonth() + 1;
  let dt: number | string = date.getDate();

  if (dt < 10) {
    dt = '0' + dt.toString();
  }
  if (month < 10) {
    month = '0' + month;
  }
  if (separator !== undefined) {
    return year + separator + month + separator + dt;
  } else {
    return year + month + dt;
  }
}
export function timeToString(date: Date, separator?: string): string {
  let hh: number | string = date.getHours();
  let mm: number | string = date.getMinutes();
  let ss: number | string = date.getSeconds();
  if (hh < 10) {
    hh = '0' + hh.toString();
  }
  if (ss < 10) {
    ss = '0' + ss.toString();
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  if (separator !== undefined) {
    return hh.toString() + separator + mm + separator + ss;
  } else {
    return hh.toString() + mm + ss;
  }
}
export function toISOString(d: Date): string {
  const s = `${dateToString(d, '-')}T${timeToString(d, ':')}.${getMilliseconds(d)}${getTimezone(d)}`;
  return s;
}
export function getTimezone(d: Date): string {
  const t = d.getTimezoneOffset() / 60;
  const p = d.getTimezoneOffset() % 60;
  if (t > 0) {
    return t > -10
      ? '-0' + Math.abs(t) + ':00'
      : '-' + Math.abs(t) + ':' + getMinutes(p);
  } else {
    return t < 9
      ? '+0' + Math.abs(t) + ':00'
      : Math.abs(t).toString() + ':' + getMinutes(p);
  }
}
export function getMinutes(p: number): string {
  const x = Math.abs(p);
  return x >= 10 ? x.toString() : '0' + x;
}
export function getMilliseconds(d: Date): string {
  const m = d.getMilliseconds();
  if (m >= 100) {
    return m.toString();
  } else if (m >= 10) {
    return '0' + m;
  } else {
    return '00' + m;
  }
}
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function getFields(attrs: Attributes, t: string): string[] {
  const fis: string[] = [];
  const keys = Object.keys(attrs);
  for (const key of keys) {
    const attr = attrs[key];
    if (attr.type === t) {
      fis.push(key);
    }
  }
  return fis;
}
export function reformatDates(obj: any, ignores: string[]): any {
  const keys = Object.keys(obj);
  for (const key of keys) {
    const v = obj[key];
    if (v instanceof Date) {
      if (!ignores.includes(key)) {
        obj[key] = toISOString(v);
      }
    }
  }
  return obj;
}
export function mkdirSync(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}
export async function createReader(filename: string, opts?: BufferEncoding): Promise<readline.Interface> {
  const c: BufferEncoding = (opts !== undefined ? opts : 'utf-8');
  const stream = fs.createReadStream(filename, c);
  await Promise.all([once(stream, 'open')]);
  const read = readline.createInterface({ input: stream, crlfDelay: Infinity });
  return read;
}
export interface StreamOptions {
  flags?: string | undefined;
  encoding?: BufferEncoding | undefined;
  fd?: number | promises.FileHandle | undefined;
  mode?: number | undefined;
  autoClose?: boolean | undefined;
  /**
   * @default false
   */
  emitClose?: boolean | undefined;
  start?: number | undefined;
  highWaterMark?: number | undefined;
}
const options: StreamOptions = { flags: 'a', encoding: 'utf-8' };
// tslint:disable-next-line:max-classes-per-file
export class LogWriter {
  private writer: WriteStream;
  suffix: string;
  constructor(filename: string, dir: string, opts?: BufferEncoding | StreamOptions, suffix?: string) {
    const o = (opts ? opts : options);
    this.suffix = (suffix ? suffix : '\n');
    this.writer = createWriteStream(dir, filename, o);
    this.writer.cork();
    this.write = this.write.bind(this);
    this.flush = this.flush.bind(this);
    this.uncork = this.uncork.bind(this);
    this.end = this.end.bind(this);
  }
  write(data: string): void {
    this.writer.write(data + this.suffix);
  }
  flush(): void {
    this.writer.uncork();
  }
  uncork(): void {
    this.writer.uncork();
  }
  end(): void {
    this.writer.end();
  }
}
export function createWriteStream(dir: string, filename: string, opts?: BufferEncoding | StreamOptions): WriteStream {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (dir.endsWith('/') || dir.endsWith('\\')) {
    return fs.createWriteStream(dir + filename, opts);
  } else {
    return fs.createWriteStream(dir + '/' + filename, opts);
  }
}
export function parseNum(s?: string): number | undefined {
  if (!s || s.length === 0) {
    return undefined;
  }
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}
export function parseNumber(s: string | undefined, d: number): number {
  if (!s || s.length === 0) {
    return d;
  }
  const n = parseFloat(s);
  return isNaN(n) ? d : n;
}
export function parseDate(s: string | undefined, undefinedIfInvalid?: boolean): Date | undefined {
  if (!s || s.length === 0) {
    return undefined;
  }
  const d = new Date(s);
  if (d instanceof Date && !isNaN(d.valueOf())) {
    return d;
  } else {
    return undefinedIfInvalid ? undefined : d;
  }
}
