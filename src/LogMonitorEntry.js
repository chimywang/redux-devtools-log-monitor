import React, { PropTypes, Component } from 'react';
import JSONTree from 'react-json-tree';
import LogMonitorEntryAction from './LogMonitorEntryAction';
import shouldPureComponentUpdate from 'react-pure-render/function';

const styles = {
  entry: {
    display: 'block',
    WebkitUserSelect: 'none'
  },

  root: {
    marginLeft: 0
  },

  changedData: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)'
  }
};

const getDeepItem = (data, path) => path.reduce((obj, key) => obj && obj[key], data);
const dataIsEqual = (data, previousData, keyPath) => {
  const path = [...keyPath].reverse().slice(1);

  return getDeepItem(data, path) === getDeepItem(previousData, path);
};

export default class LogMonitorEntry extends Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    action: PropTypes.object.isRequired,
    actionId: PropTypes.number.isRequired,
    select: PropTypes.func.isRequired,
    inFuture: PropTypes.bool,
    error: PropTypes.string,
    onActionClick: PropTypes.func.isRequired,
    collapsed: PropTypes.bool,
    expandActionRoot: PropTypes.bool,
    expandStateRoot: PropTypes.bool
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  constructor(props) {
    super(props);
    this.handleActionClick = this.handleActionClick.bind(this);
    this.shouldExpandNode = this.shouldExpandNode.bind(this);
  }

  printState(state, error) {
    let errorText = error;
    if (!errorText) {
      try {
        const data = this.props.select(state);
        let theme = this.props.theme;

        if (this.props.markStateDiff) {
          const previousData = typeof this.props.previousState !== 'undefined' ?
            this.props.select(this.props.previousState) :
            undefined;
          const getValueStyle = ({ style }, nodeType, keyPath) => ({
            style: {
              ...style,
              ...(dataIsEqual(data, previousData, keyPath) ? {} : styles.changedData)
            }
          });
          const getNestedNodeStyle = ({ style }, keyPath) => ({
            style: {
              ...style,
              ...(keyPath.length > 1 ? {} : styles.root)
            }
          });
          theme = {
            extend: this.props.theme,
            tree: styles.tree,
            value: getValueStyle,
            nestedNode: getNestedNodeStyle
          };
        }

        return (
          <JSONTree
            theme={theme}
            data={data}
            invertTheme={false}
            keyPath={['state']}
            shouldExpandNode={this.shouldExpandNode} />
        );
      } catch (err) {
        errorText = 'Error selecting state.';
      }
    }

    return (
      <div style={{
        color: this.props.theme.base08,
        paddingTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 35
      }}>
        {errorText}
      </div>
    );
  }

  handleActionClick() {
    const { actionId, onActionClick } = this.props;
    if (actionId > 0) {
      onActionClick(actionId);
    }
  }

  shouldExpandNode(keyName, data, level) {
    return this.props.expandStateRoot && level === 0;
  }

  render() {
    const { actionId, error, action, state, collapsed, inFuture } = this.props;
    const styleEntry = {
      opacity: (collapsed || inFuture) ? 0.5 : 1,
      cursor: (actionId > 0) ? 'pointer' : 'default'
    };

    return (
      <div style={{
        textDecoration: collapsed ? 'line-through' : 'none',
        color: this.props.theme.base06
      }}>
        <LogMonitorEntryAction
          theme={this.props.theme}
          collapsed={collapsed}
          action={action}
          expandActionRoot={this.props.expandActionRoot}
          onClick={this.handleActionClick}
          style={{...styles.entry, ...styleEntry}}/>
        {!collapsed &&
          <div style={{ paddingLeft: 16 }}>
            {this.printState(state, error)}
          </div>
        }
      </div>
    );
  }
}
