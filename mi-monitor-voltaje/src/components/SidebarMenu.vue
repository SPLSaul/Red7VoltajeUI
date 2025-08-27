<template>
  <sidebar-menu :menu="menu" />
</template>

<script>
  export default {
    data() {
      return {
        menu: [
          {
            header: 'Main Navigation',
            hiddenOnCollapse: true,
          },
          {
            href: '/',
            title: 'Dashboard',
            icon: 'fa fa-user',
          },
          {
            href: '/charts',
            title: 'Charts',
            icon: 'fa fa-chart-area',
            child: [
              {
                href: '/charts/sublink',
                title: 'Sub Link',
              },
            ],
          },
        ],
      }
    },
  }
</script>
menu: [
  // item
  {
    // string or a location object
    href: '/',
    // href: { path: '/' }

    title: 'Dashboard',

    // icon class
    icon: 'fa fa-user',
    /* or custom icon
    icon: {
        element: 'span',
        class: 'fa fa-user',
        // attributes: {}
        // text: ''
    }
    */

    /*
    badge: {
        text: 'new',
        class: 'vsm--badge_default'
        // attributes: {}
        // element: 'span'
    }
    */

    // child: []
    // disabled: true
    // class: ''
    // attributes: {}
    // hidden: false
    // hiddenOnCollapse: true

    /* with vue-router */
    // external: true
    // exact: true // apply active class when current route is exactly the same. (based on route records, query & hash are not relevant)

    // isActive: (item) => boolean | void // return a boolean to override the default active matcher
  },
  // header item
  {
    header: 'Main Navigation',
    // hidden: false
    // hiddenOnCollapse: true
    // class: ''
    // attributes: {}
  },
  // component item
  {
    component: componentName,
    // props: componentProps
    // hidden: false
    // hiddenOnCollapse: true
  }
]

props: {
  // Sidebar menu (required)
  menu: {
    type: Array,
    required: true
  },

  // Sidebar Collapse state (v-model:collapsed to enable two-way data binding)
  collapsed: {
    type: Boolean,
    default: false
  },

  // Sidebar width (expanded)
  width: {
    type: String,
    default: '290px'
  },

  // Sidebar width (collapsed)
  widthCollapsed: {
    type: String,
    default: '65px'
  },

  // Keep only one child opened at a time (true: first level only, 'deep': all levels)
  showOneChild: {
    type: [Boolean, String],
    default: false
  },

  // Keep all child open
  showChild: {
    type: Boolean,
    default: false
  },

  // Sidebar right to left
  rtl: {
    type: Boolean,
    default: false
  },

  // Make sidebar relative to the parent (by default the sidebar is relative to the viewport)
  relative: {
    type: Boolean,
    default: false
  },

  // Hide toggle collapse btn
  hideToggle: {
    type: Boolean,
    default: false
  },

  // Sidebar theme (available themes: 'white-theme')
  theme: {
    type: String,
    default: ''
  },

  // Disable hover on collapse mode
  disableHover: {
    type: Boolean,
    default: false
  },

  // The name of the custom link component (must be registered globally and define item as a prop)
  linkComponentName: {
    type: String,
    default: undefined
  },

  // Smooth scroll on item expand
  smoothScroll: {
    type: Boolean,
    default: false,
  },
}

<sidebar-menu @update:collapsed="onToggleCollapse" @item-click="onItemClick" />
... methods: { onToggleCollapse(collapsed) {}, onItemClick(event, item) {} } ...