/*************************************************************/
/* Widget initial */
/*************************************************************/
Template.WidgetRegisterOptional.onRendered(function() {
    AutoForm.resetForm("registerOptionalForm");
});

Template.WidgetRegisterOptional.onCreated(function(){
    this.uploadingProfilePicture = new ReactiveVar(false);
});

/*************************************************************/
/* Widget helpers */
/*************************************************************/
Template.WidgetRegisterOptional.helpers({
    formSchema: Partup.schemas.forms.registerOptional,
    placeholders: Partup.services.placeholders.registerOptional,
    profile: function() {
        var user = Meteor.user()
        return user ? user.profile : {};
    },
    profilePicture: function() {
        var uploadedImageID = Session.get('partials.register-optional.uploaded-image');

        if (uploadedImageID) {
            return Images.findOne({ _id: uploadedImageID });
        }

        var user = Meteor.user();

        if (user && user.profile && user.profile.image) {
            return Images.findOne({ _id: user.profile.image });
        }
    },
    fieldsFromUser: function() {
        var user = Meteor.user();
        if (user) {
            return Partup.transformers.profile.toFormRegisterOptional(user);
        }
        return undefined;
    },
    uploadingProfilePicture: function(){
        return Template.instance().uploadingProfilePicture.get();
    }
});

/*************************************************************/
/* Widget events */
/*************************************************************/
Template.WidgetRegisterOptional.events({
    'click [data-browse-photos]': function eventClickBrowse(event, template){
        event.preventDefault();

        // in stead fire click event on file input
        var input = $('input[data-profile-picture-input]');
        input.click();
    },
    'change [data-profile-picture-input]': function eventChangeFile(event, template){
        template.uploadingProfilePicture.set(true);
        
        FS.Utility.eachFile(event, function (file) {
            Images.insert(file, function (error, image) {
                template.$('input[name=image]').val(image._id);
                Meteor.subscribe('images.one', image._id);
                Session.set('partials.register-optional.uploaded-image', image._id);
                template.uploadingProfilePicture.set(false);
            });
        });
    }
});


/*************************************************************/
/* Widget functions */
/*************************************************************/
var continueRegister = function() {
    var user = Meteor.user();
    if(!user) return;

    var returnUrl = Session.get('application.return-url');

    if(returnUrl) {

        // Intent
        Session.set('application.return-url', undefined);
        Router.go(returnUrl);

    } else {

        // Home fallback
        Router.go('home');

    }
};


/*************************************************************/
/* Widget form hooks */
/*************************************************************/
AutoForm.hooks({
    registerOptionalForm: {
        beginSubmit: function() {
            Partup.ui.forms.removeAllStickyFieldErrors(this);
        },
        onSubmit: function(insertDoc, updateDoc, currentDoc) {
            var self = this;

            Meteor.call('users.update', insertDoc, function(error, res){
                if(error && error.message) {
                    switch (error.message) {
                        // case 'User not found [403]':
                        //     Partup.ui.forms.addStickyFieldError(self, 'email', 'emailNotFound');
                        //     break;
                        default:
                            Partup.ui.notify.error(error.reason);
                    }
                    AutoForm.validateForm(self.formId);
                    self.done(new Error(error.message));
                    return;
                }

                self.done();
                continueRegister();
            });

            return false;
        }
    }
});
