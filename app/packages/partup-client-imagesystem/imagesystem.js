/**
 * Image system widget
 * 
 * This widget is dependant on it's parent to pass the following handlers
 * 
 * @module ImageSystemx
 * @param {ReactiveVar} imageId A reactive source that holds the image Id so the parent template.
 * @param {ReactiveDict} focuspoint [OPTIONAL] A reactive dictionary that holds the x and y of a focuspoint to adjust the center of an image.
 */
//jscs:enable
Template.ImageSystem.onCreated(function() {
    if (!this.data.imageId) {
        throw new Error("The ImageSystem is dependant on 'imageId', this has to be a ReactiveVar passed in from it's parent.");
    }

    // A ReactiveVar that holds the ID of the current image,
    // this get's passed by the parent template to share access.
    this.imageId = this.data.imageId;

    // Tell the view when to show the loading indicator
    this.loading = new ReactiveVar();

    // Focuspoint handler
    this.focuspoint = this.data.focuspoint || new ReactiveDict();
    this.focuspoint.set('x', 0.5);
    this.focuspoint.set('y', 0.5);

    // This get's passed to the 'focuspoint' template via a helper to give it control over the focuspoint
    this.setFocuspoint = (x = 0.5, y = 0.5) => {
        this.focuspoint.set('x', x);
        this.focuspoint.set('y', y);
    }

    this.draggingFocuspoint = new ReactiveVar(false);

    // Placeholder for image subscription.
    this.imageSubHandler = undefined;

    // Hack because template get's created twice in some cases, see bottom of onRendered.
    this.initTimeout = 0;
});

Template.ImageSystem.onRendered(function() {
    const template = this;
    const browseButton = template.find('[data-browse]');

    template.uploader = new Pluploader({
        dynamic_url: true,
        config: {
            browse_button: browseButton,
            container: template.find('[data-upload-container]'),
            drop_element: template.find('[data-drop-area]'),
            multi_selection: false,
        },
        types: [
            Partup.helpers.files.toUploadFilter('image'),
        ],
        hooks: {
            FilesAdded(uploader, files) {
                _.each(files, file => {
                    if (!Partup.helpers.files.isImage(file)) {
                        uploader.removeFile(file);
                        // TODO: Add PhraseApp translations for checking file types
                        Partup.client.notify.info(`File removed, could not determine that ${file.name} is an image`);
                    }
                });

                if (uploader.files.length > 0) {
                    template.loading.set(true);
                    uploader.start();
                }
            },
            FileUploaded(uploader, file, result) {
                if (!result) return;
                const response = JSON.parse(result.response);

                if (response.error) {
                    template.loading.set(false);
                    return Partup.client.notify.error(TAPi18n.__(response.error));
                }

                // This might not be nessecary, have to look at the server side code.
                if (!response.image) {
                    template.loading.set(false);
                    return Partup.client.notify.info('Something went wrong with uploading the image, please contact');
                }

                // Stop the old subscription once the new image is uploaded.
                if (template.imageSubHandler) {
                    template.imageSubHandler.stop();
                }
                // The subscription is required to be able to access the Images collection from the helpers
                template.imageSubHandler = template.subscribe('images.one', response.image, {
                    onReady() {
                        template.loading.set(false);
                        template.imageId.set(response.image);
                        template.setFocuspoint();
                    },
                });
            },
        },
    });

    // In some cases the template get's created twice, 
    // to prevent errors while plupload is initializing a timeout is nessecary
    this.initTimeout = setTimeout(function() {
        template.uploader.init();
    }, 1500);

    // Add event listeners to add visual when a file is dragged over the drop area.
    (function () {
        const $dropEl = $(template.find('[data-drop-area]'));
        const activeClass = 'pu-drop-active';

        let ignoreLeave = false;

        $dropEl.on('dragenter', function(event) {
            if (event.target !== this) {
                ignoreLeave = true;
            }
            $(this).addClass(activeClass);
        }).on('dragleave', function(event) {
            if (ignoreLeave) {
                ignoreLeave = false;
                return;
            }
            $(this).removeClass(activeClass);
        }).on('dragend', function(event) {
            $dropEl.removeClass(activeClass);
        }).on('drop', function(event) {
            $dropEl.removeClass(activeClass);
        });

        _.each($dropEl.children, child => {
            $(child).on('dragleave', function(event) {
                event.stopPropagation();
            });
        });

        // Prevent default behavior for the cover button on tablet or mobile so the input get's activated right away
        // iOS / Chrome does not activate the uploader when pressing the browse button
        // Setting pointer events to none input created by pluploader get's pressed instead
        if (Partup.client.isMobile.iOS()) {
            $(browseButton).css({
                'pointer-events': 'none'
            });
        }

    }());
});

Template.ImageSystem.onDestroyed(function() {
    clearTimeout(this.initTimeout);
    if (this.imageSubHandler) {
        this.imageSubHandler.stop();
    }
    this.uploader.destroy();
});

Template.ImageSystem.helpers({
    imageId() {
        return Template.instance().imageId.get();
    },
    imageUrl() {
        const imageId = Template.instance().imageId.get();
        if (!imageId) {
            return;
        }
        const image = Images.findOne({ _id: imageId });
        return Partup.helpers.url.getImageUrl(image, '1200x520');
    },
    loading() {
        return Template.instance().loading.get();
    },
    draggingFocuspoint() {
        return Template.instance().draggingFocuspoint.get();
    },
    focuspointView() {
        return {
            template: Template.instance(),
            selector: '[data-focuspoint-view]',
        }
    },
    setFocuspoint() {
        const template = Template.instance();
        return function(focuspoint) {
            focuspoint.on('drag:start', () => {
                template.draggingFocuspoint.set(true);
            });
            focuspoint.on('drag:end', (x, y) => {
                template.draggingFocuspoint.set(false);
                template.setFocuspoint(x, y);
            });
        }
    },
    unsetFocuspoint() {
        const template = Template.instance();
        return function() {
            // do nothing....
            // The focuspoint requires an unset handler, we don't need this funtionallity though.
        }
    },
});
