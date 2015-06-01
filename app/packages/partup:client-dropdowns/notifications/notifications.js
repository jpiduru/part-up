Template.DropdownNotifications.rendered = function(){
    // this = template
    this.dropdownToggleBool = 'widget-dropdown-notifications.opened';

    // set default boolean values
    Session.set(this.dropdownToggleBool, false);

    ClientDropdowns.addOutsideDropdownClickHandler(this, '[data-clickoutside-close]', '[data-toggle-menu]');
};

Template.DropdownNotifications.destroyed = function(){
    // remove click handler on destroy
    Session.set(this.dropdownToggleBool, false);
    ClientDropdowns.removeOutsideDropdownClickHandler(this);
};

Template.DropdownNotifications.events({
    'click [data-toggle-menu]': ClientDropdowns.dropdownClickHandler
});

Template.DropdownNotifications.helpers({
    menuOpen: function(){
        return Session.get('widget-dropdown-notifications.opened');
    },
    notifications: function () {
        return Notifications.find();
    }
});
