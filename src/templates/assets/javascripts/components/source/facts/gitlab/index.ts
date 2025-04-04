/*
 * Copyright (c) 2016-2025 Martin Donath <martin.donath@squidfunk.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import { ProjectSchema } from "gitlab"
import {
  EMPTY,
  Observable,
  catchError,
  defaultIfEmpty,
  map,
  zip
} from "rxjs"

import { requestJSON } from "~/browser"

import { SourceFacts } from "../_"

/* ----------------------------------------------------------------------------
 * Helper types
 * ------------------------------------------------------------------------- */

/**
 * GitLab release (partial)
 */
interface Release { // @todo remove and use the ReleaseSchema type instead after switching from gitlab to @gitbeaker/rest
  tag_name: string                     /* Tag name */
}

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Fetch GitLab repository facts
 *
 * @param base - GitLab base
 * @param project - GitLab project
 *
 * @returns Repository facts observable
 */
export function fetchSourceFactsFromGitLab(
  base: string, project: string
): Observable<SourceFacts> {
  const url = `https://${base}/api/v4/projects/${encodeURIComponent(project)}`
  return zip(

    /* Fetch version */
    requestJSON<Release>(`${url}/releases/permalink/latest`)
      .pipe(
        catchError(() => EMPTY), // @todo refactor instant loading
        map(({ tag_name }) => ({
          version: tag_name
        })),
        defaultIfEmpty({})
      ),

    /* Fetch stars and forks */
    requestJSON<ProjectSchema>(url)
      .pipe(
        catchError(() => EMPTY), // @todo refactor instant loading
        map(({ star_count, forks_count }) => ({
          stars: star_count,
          forks: forks_count
        })),
        defaultIfEmpty({})
      )
  )
    .pipe(
      map(([release, info]) => ({ ...release, ...info }))
    )
}
