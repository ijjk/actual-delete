'use babel';

import { CompositeDisposable } from 'atom';
import fse from 'fs-extra';

export default {

    config: {
        confirmDelete: {
            description: 'Confirm before permanently deleting files',
            type: 'boolean',
            default: true
        }
    },

    subscriptions: null,

    activate(state) {
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
          'actual-delete:delete': () => this.delete()
        }));
    },

    deactivate() {
        this.subscriptions.dispose();
    },

    error(shortMsg, longMsg) {
        atom.confirm({
            message: shortMsg,
            detailedMessage: longMsg
        });
    },

    delete() {
        let handlePlugins = {

            'nuclide-file-tree': function() {
                let fileTree = atom.packages.getActivePackage('nuclide-file-tree');
                fileTree = fileTree.mainModule._createView();

                let selPath = fileTree._store._selectionRange._anchor._nodeKey;

                if(selPath.indexOf('nuclide://') > -1) {
                    this.error('Actual-delete: error deleting...', 'Nuclide remote folders are currently not supported. Although if you are connecting to a server without a trash or recycle bin the file should be permanently deleted with the normal delete option.');
                    return 'err';
                }

                return selPath;
            },

            'tree-view': function() {
                let fileTree = atom.packages.getActivePackage('tree-view');
                    fileTree = fileTree.mainModule.treeView;

                return fileTree.selectedPath;
            },
        }
        handlePlugins['nuclide-file-tree'] = handlePlugins['nuclide-file-tree'].bind(this);

        let supportedPkgs = Object.keys(handlePlugins);
        let selPath = null;
        let supportedPlugin = false;
        let hadErr = false;

        supportedPkgs.some((pkg, i)  => {
            if(!atom.packages.isPackageActive(pkg))
                return false;

            supportedPlugin = true;
            selPath = handlePlugins[pkg]();

            if(selPath && selPath !== 'err')
                return true;
        });

        if(selPath === 'err')
            return;

        if(!supportedPlugin) {
            this.error('Actual-delete: error deleting...', 'Current file-view plugin is not yet supported.');
            return;
        }

        let confirmOpts = {
            message: 'Actual-delete: confirm!',
            detailedMessage: 'Are you positive you want to permanently delete: ' + selPath,
            buttons: {
                'Delete Permanently': function() {
                    this.runDelete(selPath);
                },
                Cancel: null
            }
        };
        confirmOpts.buttons['Delete Permanently'] = confirmOpts.buttons['Delete Permanently'].bind(this);

        if(atom.config.get('actual-delete.confirmDelete')) {
            atom.confirm(confirmOpts);
            return;
        }
        else {
            this.runDelete(selPath);
        }
    },

    runDelete(selPath) {
        fse.remove(selPath, (err) => {
            if(err) {
                this.error('Actual-delete: error while deleting...',
                    'The path: ' + selPath + ' could not be deleted.');
                console.log('actual-delete: ', err);
            }
        })
    }
};
