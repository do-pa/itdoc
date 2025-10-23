/*
 * Copyright 2025 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react"

import styles from "./styles.module.css"

interface SwaggerPreviewProps {
    isOpen: boolean
    titleId: string
    onClose: () => void
    previewHtml: string | null
    hasDocument: boolean
}

const SwaggerPreview: React.FC<SwaggerPreviewProps> = ({
    isOpen,
    titleId,
    onClose,
    previewHtml,
    hasDocument,
}) => {
    if (!isOpen) {
        return null
    }

    return (
        <div
            className={styles.previewModalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={onClose}
        >
            <div className={styles.previewModal} onClick={(event) => event.stopPropagation()}>
                <header className={styles.previewModalHeader}>
                    <h2 id={titleId}>Swagger Preview</h2>
                    <button type="button" className={styles.previewModalClose} onClick={onClose}>
                        Close
                    </button>
                </header>
                <div className={styles.previewModalBody}>
                    {hasDocument ? (
                        previewHtml ? (
                            <iframe
                                title="Swagger Preview"
                                className={styles.previewModalFrame}
                                srcDoc={previewHtml}
                                sandbox="allow-scripts allow-same-origin"
                            />
                        ) : (
                            <p className={styles.previewModalEmpty}>
                                Unable to render the Redoc preview. Re-run the tests and try
                                again.
                            </p>
                        )
                    ) : (
                        <p className={styles.previewModalEmpty}>
                            Run the tests to generate the OpenAPI document before opening the
                            preview.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SwaggerPreview
